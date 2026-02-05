/**
 * Parser module extracted for testing
 * This is synchronized with the Parser from nix-helper.user.js and paste-to-console.js
 */

export const Parser = {
    /**
     * Clean HTML tags from content
     */
    cleanHtml(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent.trim();
    },

    /**
     * Parse the full API response (with questions wrapper)
     * This handles the format: { questions: [{ question: {...}, answer_display: "..." }, ...] }
     */
    parse(jsonString) {
        try {
            const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
            const extracted = [];

            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach((q, index) => {
                    const questionData = q.question;
                    if (!questionData) return;

                    const processed = this.processQuestion(questionData, q, index);
                    if (processed) extracted.push(processed);
                });
            }

            return extracted;
        } catch (e) {
            console.error('Parse failed', e);
            return [];
        }
    },

    /**
     * Process a question and extract answers based on type
     * @param {Object} q - The question object
     * @param {Object} qWrapper - The question wrapper containing answer_display
     * @param {number} index - Question index
     */
    processQuestion(q, qWrapper = {}, index = 0) {
        const result = {
            id: q.id,
            type: q.type,
            order: q.order || index + 1,
            title: this.cleanHtml(q.title),
            content: this.cleanHtml(q.content || ''),
            answers: []
        };

        // STRATEGY: TYPE 3 (Drag & Drop Text / Reordering)
        if (q.type === 3) {
            if (q.answers && Array.isArray(q.answers)) {
                // Method 1: Try parsing JSON content (older format)
                let foundAnswers = false;
                q.answers.forEach(ans => {
                    try {
                        const contentObj = JSON.parse(ans.content);
                        if (contentObj.child_answers) {
                            contentObj.child_answers.forEach(child => {
                                result.answers.push({
                                    content: child.content,
                                    targetIndex: child.target_index,
                                    reusable: child.reusable || false,
                                    type: 'drag-order'
                                });
                            });
                            foundAnswers = true;
                        }
                    } catch (_e) {
                        /* Not JSON format, try other methods */
                    }
                });

                // Method 2: Use draggable_answer with correct_index (newer format)
                if (!foundAnswers) {
                    // Build a map of correct_index -> answer content
                    const answerByIndex = new Map();
                    q.answers.forEach(ans => {
                        if (ans.draggable_answer && ans.draggable_answer.correct_index != null) {
                            answerByIndex.set(ans.draggable_answer.correct_index, {
                                content: this.cleanHtml(ans.content),
                                reusable: ans.draggable_answer.reusable === 1
                            });
                        }
                    });

                    // Parse [[n]] pattern from question content to get physical positions
                    const content = q.content || '';
                    const placeholderRegex = /\[\[(\d+)\]\]/g;
                    let match;
                    let physicalPosition = 1;

                    while ((match = placeholderRegex.exec(content)) !== null) {
                        const placeholderNum = parseInt(match[1], 10);
                        const answerInfo = answerByIndex.get(placeholderNum);

                        if (answerInfo) {
                            result.answers.push({
                                content: answerInfo.content,
                                targetIndex: physicalPosition,
                                placeholderNum: placeholderNum,
                                reusable: answerInfo.reusable,
                                type: 'drag-order'
                            });
                        }
                        physicalPosition++;
                    }

                    // Fallback: if no [[n]] pattern found, use direct indices
                    if (result.answers.length === 0 && answerByIndex.size > 0) {
                        q.answers.forEach(ans => {
                            if (ans.draggable_answer && ans.draggable_answer.correct_index != null) {
                                result.answers.push({
                                    content: this.cleanHtml(ans.content),
                                    targetIndex: ans.draggable_answer.correct_index,
                                    reusable: ans.draggable_answer.reusable === 1,
                                    type: 'drag-order'
                                });
                            }
                        });
                        result.answers.sort((a, b) => a.targetIndex - b.targetIndex);
                    }
                }
            }
        }
        // STRATEGY: TYPE 4 (Drag & Drop with coordinates)
        else if (q.type === 4 && qWrapper.answer_display) {
            try {
                const correctOrderIds = JSON.parse(qWrapper.answer_display);
                if (Array.isArray(correctOrderIds) && q.answers) {
                    correctOrderIds.forEach((answerId, index) => {
                        const answer = q.answers.find(ans => ans.id === answerId);
                        if (answer && answer.draggable_answer && answer.draggable_answer.coordinates) {
                            const coord = answer.draggable_answer.coordinates[0];
                            result.answers.push({
                                content: this.cleanHtml(answer.content),
                                order: index,
                                coordinates: { x: coord.x, y: coord.y },
                                type: 'drag-position'
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Error parsing Type 4 answer_display:', e);
            }
        }
        // STRATEGY: TYPE 5 (Matching)
        else if (q.type === 5) {
            // Method 1: Using matching_answers array
            if (q.matching_answers && q.answers) {
                q.matching_answers.forEach(match => {
                    const ansObj = q.answers.find(a => a.id === match.answer_id);
                    if (ansObj) {
                        result.answers.push({
                            question: this.cleanHtml(ansObj.content),
                            answer: match.answer_matching,
                            answerId: match.answer_id,
                            type: 'match'
                        });
                    }
                });
            }
            // Method 2: Using target_answer in answers (simpler format)
            else if (q.answers) {
                q.answers.forEach(ans => {
                    if (ans.content && ans.target_answer) {
                        result.answers.push({
                            question: this.cleanHtml(ans.content),
                            answer: this.cleanHtml(ans.target_answer),
                            type: 'match'
                        });
                    }
                });
            }
        }
        // STRATEGY: TYPE 7 (Fill in blank / Short Answer / Single Choice Dropdown)
        else if (q.type === 7 && q.answers) {
            q.answers.forEach((ans, idx) => {
                try {
                    const contentObj = JSON.parse(ans.content);

                    // Handle single-choice dropdown/radio type
                    if (contentObj.type === 'single-choice' && contentObj.child_answers) {
                        const correctIdx = contentObj.correctAnswerIndex;
                        if (correctIdx !== undefined && contentObj.child_answers[correctIdx]) {
                            result.answers.push({
                                content: contentObj.child_answers[correctIdx].content,
                                allOptions: contentObj.child_answers.map(c => c.content),
                                correctIndex: correctIdx,
                                order: idx + 1,
                                type: 'dropdown-choice'
                            });
                        }
                    }
                    // Handle regular text fill-in
                    else if (contentObj.child_answers) {
                        contentObj.child_answers.forEach(child => {
                            if (child.content) {
                                result.answers.push({
                                    content: child.content,
                                    order: idx + 1,
                                    type: 'text'
                                });
                            }
                        });
                    }
                } catch (_e) {
                    /* Ignore parse errors */
                }
            });
        }
        // STRATEGY: STANDARD (Multiple Choice, Checkbox)
        else if (q.answers) {
            q.answers
                .filter(a => a.correct === 1)
                .forEach(a => {
                    const cleanedContent = this.cleanHtml(a.content);
                    const isImageAnswer = a.content && a.content.includes('<img') && !cleanedContent;
                    result.answers.push({
                        content: cleanedContent,
                        rawHtml: a.content,
                        answerId: a.id,
                        correctIndex: q.answers.indexOf(a),
                        isImage: isImageAnswer,
                        type: 'choice'
                    });
                });
        }

        return result.answers.length > 0 ? result : null;
    },

    /**
     * Parse full API response (alias for backward compatibility)
     */
    parseResponse(data) {
        if (!data?.questions) return [];
        return data.questions.map(q => this.processQuestion(q)).filter(q => q !== null);
    }
};
