/**
 * Parser module extracted for testing
 * This is a simplified version of the Parser from nix-helper.user.js
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
     * Process a question and extract answers based on type
     */
    processQuestion(q) {
        const result = {
            id: q.id,
            type: q.type,
            order: q.order,
            title: this.cleanHtml(q.title),
            answers: []
        };

        // STRATEGY: TYPE 3 (Ordering / Drag and Drop)
        if (q.type === 3 && q.answers) {
            q.answers.forEach(ans => {
                try {
                    const contentObj = JSON.parse(ans.content);
                    if (contentObj.child_answers) {
                        contentObj.child_answers.forEach(child => {
                            result.answers.push({
                                content: child.content,
                                targetIndex: child.target_index,
                                reusable: child.reusable || false
                            });
                        });
                    }
                } catch (_e) {
                    /* Ignore parse errors */
                }
            });
        }
        // STRATEGY: TYPE 5 (Matching)
        else if (q.type === 5 && q.answers) {
            q.answers.forEach(ans => {
                if (ans.content && ans.target_answer) {
                    result.answers.push({
                        question: this.cleanHtml(ans.content),
                        answer: this.cleanHtml(ans.target_answer)
                    });
                }
            });
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
                    result.answers.push({
                        content: this.cleanHtml(a.content),
                        type: 'choice'
                    });
                });
        }

        return result.answers.length > 0 ? result : null;
    },

    /**
     * Parse full API response
     */
    parseResponse(data) {
        if (!data?.questions) return [];

        return data.questions.map(q => this.processQuestion(q)).filter(q => q !== null);
    }
};
