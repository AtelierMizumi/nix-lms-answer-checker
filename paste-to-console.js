/**
 * NIX Digital LMS Answer Extractor - Stealth & Modular Version
 *
 * ARCHITECTURE NOTES:
 * 1. Fully encapsulated in IIFE to prevent global scope pollution (Anti-cheat evasion).
 * 2. Modular design: Network, Parser, Solver, UI, Utils.
 * 3. Strategy Pattern for different question types (Type 3, 4, 5, 7).
 * 4. Safe DOM manipulation and Event simulation.
 * 5. Debug mode with manual JSON paste for testing.
 */

(function () {
    'use strict';

    // --- CONFIGURATION & STATE ---
    const CONFIG = {
        DEBUG: true,
        AUTO_FILL_DELAY: 500, // ms
        SELECTORS: {
            QUESTION_CONTAINER: '.question-container, .questions', // Generic container
            TYPE_3_DROP_ZONE: '.ui-droppable, .static', // Drop zones for Type 3
            TYPE_3_DRAGGABLE: '.draggable' // Draggables for Type 3
        }
    };

    const STATE = {
        answers: [],
        isAutoCompleting: false,
        uiVisible: true
    };

    // --- MODULE: UTILS ---
    const Utils = {
        log(...args) {
            if (CONFIG.DEBUG) console.log('🥷 [NIX-Helper]:', ...args);
        },

        error(...args) {
            console.error('❌ [NIX-Helper Error]:', ...args);
        },

        /**
         * Wait for an element to appear in the DOM
         * @param {string} selector
         * @param {HTMLElement} parent
         * @param {number} timeout
         * @returns {Promise<Element>}
         */
        waitForElement(selector, parent = document, timeout = 3000) {
            return new Promise(resolve => {
                if (parent.querySelector(selector)) {
                    return resolve(parent.querySelector(selector));
                }

                const observer = new MutationObserver(() => {
                    if (parent.querySelector(selector)) {
                        observer.disconnect();
                        resolve(parent.querySelector(selector));
                    }
                });

                observer.observe(parent, {
                    childList: true,
                    subtree: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
        },

        copyToClipboard(text) {
            if (navigator.clipboard) {
                return navigator.clipboard.writeText(text);
            }
            return Promise.reject('Clipboard API not available');
        },

        /**
         * Trigger native value setter for React/Vue compatibility
         */
        setNativeValue(element, value) {
            const valueSetter =
                Object.getOwnPropertyDescriptor(element, 'value')?.set ||
                Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), 'value')?.set;

            if (valueSetter) {
                valueSetter.call(element, value);
            } else {
                element.value = value;
            }

            // Trigger all relevant events
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    // --- MODULE: PARSER ---
    // Handles extraction of answers from raw JSON
    const Parser = {
        parse(jsonString) {
            try {
                const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
                const extracted = [];

                // Support new structure with "questions" array
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
                Utils.error('Parse failed', e);
                return [];
            }
        },

        processQuestion(q, qWrapper, index) {
            const result = {
                id: q.id,
                order: index + 1,
                title: this.cleanHtml(q.title || ''),
                content: this.cleanHtml(q.content || ''),
                type: q.type,
                answers: [] // Format: { content: "...", index: 1, ...metadata }
            };

            // STRATEGY: TYPE 3 (Drag & Drop Text / Reordering)
            // Based on user log: answers have `draggable_answer.correct_index`
            if (q.type === 3) {
                if (q.answers && Array.isArray(q.answers)) {
                    q.answers.forEach(ans => {
                        // Check if it has draggable info with correct_index
                        if (
                            ans.draggable_answer &&
                            ans.draggable_answer.correct_index !== null &&
                            ans.draggable_answer.correct_index !== undefined
                        ) {
                            result.answers.push({
                                content: this.cleanHtml(ans.content),
                                targetIndex: ans.draggable_answer.correct_index,
                                reusable: ans.draggable_answer.reusable === 1,
                                type: 'drag-order'
                            });
                        }
                    });
                    // Sort by target index for display
                    result.answers.sort((a, b) => a.targetIndex - b.targetIndex);
                }
            }
            // STRATEGY: TYPE 4 (Drag & Drop with coordinates)
            else if (q.type === 4 && qWrapper.answer_display) {
                try {
                    const correctOrderIds = JSON.parse(qWrapper.answer_display);
                    if (Array.isArray(correctOrderIds)) {
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
                    Utils.error('Error parsing Type 4 answer_display:', e);
                }
            }
            // STRATEGY: TYPE 5 (Matching)
            else if (q.type === 5 && q.matching_answers) {
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

        cleanHtml(html) {
            if (!html) return '';
            const temp = document.createElement('div');
            temp.innerHTML = html;
            return temp.textContent.trim();
        }
    };

    // --- MODULE: SOLVER ---
    // Handles the logic of applying answers to the DOM
    const Solver = {
        async solve(answers) {
            Utils.log('🚀 Starting Auto-fill...');
            STATE.isAutoCompleting = true;

            for (const ans of answers) {
                if (!STATE.isAutoCompleting) break;
                await this.fillQuestion(ans);
                // Small delay between questions
                await new Promise(r => setTimeout(r, CONFIG.AUTO_FILL_DELAY));
            }

            Utils.log('🏁 Auto-fill finished.');
            STATE.isAutoCompleting = false;
        },

        async fillQuestion(questionData) {
            // Try multiple selector strategies to find the question container
            let container = null;

            // Strategy 1: Data attribute
            container = await Utils.waitForElement(`[data-id="${questionData.id}"]`, document, 2000);

            // Strategy 2: Find by order
            if (!container) {
                const allQuestions = document.querySelectorAll(CONFIG.SELECTORS.QUESTION_CONTAINER);
                container = allQuestions[questionData.order - 1];
            }

            if (!container) {
                Utils.log(`⚠️ Question container not found for Q${questionData.order} (ID: ${questionData.id})`);
                return;
            }

            Utils.log(`✅ Processing Q${questionData.order} (Type ${questionData.type})...`);

            try {
                if (questionData.type === 3) {
                    await this.handleType3(container, questionData);
                } else if (questionData.type === 4) {
                    await this.handleType4(container, questionData);
                } else if (questionData.type === 5) {
                    await this.handleType5(container, questionData);
                } else if (questionData.type === 7) {
                    await this.handleType7(container, questionData);
                } else {
                    await this.handleStandard(container, questionData);
                }
            } catch (e) {
                Utils.error(`Failed to fill Q${questionData.order}:`, e);
            }
        },

        // --- TYPE 3: Drag & Drop with Index ---
        async handleType3(container, questionData) {
            Utils.log('🎯 Type 3 - Drag & Drop with Index');

            // Find all draggable elements
            const draggables = container.querySelectorAll(CONFIG.SELECTORS.TYPE_3_DRAGGABLE);

            if (draggables.length === 0) {
                Utils.log('⚠️ No draggable elements found');
                return;
            }

            // Process each answer
            for (const answer of questionData.answers) {
                // Find the draggable element matching this content
                let foundDraggable = null;

                for (const drag of draggables) {
                    const dragText = drag.textContent.trim();
                    if (dragText === answer.content) {
                        foundDraggable = drag;
                        break;
                    }
                }

                if (!foundDraggable) {
                    Utils.log(`⚠️ Draggable not found for: "${answer.content}"`);
                    continue;
                }

                // Find the target drop zone by index
                // The pattern in LMS is usually [[1]], [[2]], [[3]], etc.
                const dropZones = container.querySelectorAll(CONFIG.SELECTORS.TYPE_3_DROP_ZONE);
                const targetZone = dropZones[answer.targetIndex - 1]; // Convert 1-based to 0-based

                if (!targetZone) {
                    Utils.log(`⚠️ Drop zone not found for index: ${answer.targetIndex}`);
                    continue;
                }

                // Simulate drag and drop
                await this.simulateDragDrop(foundDraggable, targetZone);
                Utils.log(`✅ Dragged "${answer.content}" to position ${answer.targetIndex}`);

                // Small delay between drags
                await new Promise(r => setTimeout(r, 200));
            }
        },

        // --- TYPE 4: Drag & Drop with Coordinates ---
        async handleType4(container, questionData) {
            Utils.log('🎯 Type 4 - Drag & Drop with Coordinates');

            const dragArea = container.querySelector('.image-area-container');
            if (!dragArea) {
                Utils.log('⚠️ No drag area found');
                return;
            }

            for (const answer of questionData.answers) {
                const draggables = dragArea.querySelectorAll(CONFIG.SELECTORS.TYPE_3_DRAGGABLE);
                let foundDraggable = null;

                for (const drag of draggables) {
                    if (drag.textContent.trim() === answer.content) {
                        foundDraggable = drag;
                        break;
                    }
                }

                if (!foundDraggable) {
                    Utils.log(`⚠️ Draggable not found: "${answer.content}"`);
                    continue;
                }

                // Set absolute position
                foundDraggable.style.position = 'absolute';
                foundDraggable.style.left = answer.coordinates.x + 'px';
                foundDraggable.style.top = answer.coordinates.y + 'px';
                foundDraggable.style.zIndex = '1000';

                // Trigger drag events if jQuery UI is available
                if (window.$ && $(foundDraggable).hasClass('ui-draggable')) {
                    $(foundDraggable).trigger('dragstop');
                }

                Utils.log(`✅ Positioned "${answer.content}" at (${answer.coordinates.x}, ${answer.coordinates.y})`);
            }
        },

        // --- TYPE 5: Matching Questions ---
        async handleType5(container, questionData) {
            Utils.log('🎯 Type 5 - Matching Questions');

            const selects = container.querySelectorAll('select.answer-matching, select');

            for (const answer of questionData.answers) {
                // Find the select for this specific question
                for (const select of selects) {
                    const parentRow = select.closest('.d-flex, .row, .form-group');
                    if (!parentRow) continue;

                    const questionText = parentRow.textContent;
                    if (questionText.includes(answer.question)) {
                        // Find matching option
                        const options = select.querySelectorAll('option');
                        for (const option of options) {
                            const optionText = option.textContent.trim();
                            if (optionText === answer.answer || optionText.includes(answer.answer)) {
                                select.value = option.value;

                                // Trigger events
                                if (window.$ && $(select).data('select2')) {
                                    $(select).trigger('change');
                                } else {
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                }

                                Utils.log(`✅ Matched: "${answer.question}" → "${answer.answer}"`);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
        },

        // --- TYPE 7: Fill in the Blank / Dropdown Choice ---
        async handleType7(container, questionData) {
            Utils.log('🎯 Type 7 - Fill in the Blank / Dropdown Choice');

            for (const answer of questionData.answers) {
                // Handle dropdown-choice (radio button selection)
                if (answer.type === 'dropdown-choice') {
                    Utils.log(`🔍 Looking for radio with text: "${answer.content}"`);

                    const radios = container.querySelectorAll('input[type="radio"]');
                    let found = false;

                    for (const radio of radios) {
                        const label = radio.closest('label') || radio.parentElement;
                        const row = radio.closest('.d-flex, .row, .form-group, .answer-option, li');
                        const textContainer = row || label;

                        if (textContainer && textContainer.textContent.includes(answer.content)) {
                            radio.checked = true;
                            radio.click();
                            radio.dispatchEvent(new Event('change', { bubbles: true }));
                            Utils.log(`✅ Selected radio: "${answer.content.substring(0, 30)}..."`);
                            found = true;
                            break;
                        }
                    }

                    // Also try select dropdowns
                    if (!found) {
                        const selects = container.querySelectorAll('select');
                        for (const select of selects) {
                            const options = select.querySelectorAll('option');
                            for (const option of options) {
                                if (option.textContent.includes(answer.content)) {
                                    select.value = option.value;
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    Utils.log(`✅ Selected dropdown: "${answer.content.substring(0, 30)}..."`);
                                    found = true;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                    }

                    if (!found) {
                        Utils.log(`⚠️ Could not find element for: "${answer.content.substring(0, 30)}..."`);
                    }
                }
                // Handle regular text input
                else if (answer.type === 'text') {
                    const inputs = container.querySelectorAll('input[type="text"], textarea');
                    const idx = answer.order - 1;
                    if (inputs[idx]) {
                        Utils.setNativeValue(inputs[idx], answer.content);
                        Utils.log(`✅ Filled blank ${answer.order}: "${answer.content}"`);
                    }
                }
            }
        },

        // --- STANDARD: Radio, Checkbox, Text ---
        async handleStandard(container, questionData) {
            Utils.log('🎯 Standard Question Type');

            for (const answer of questionData.answers) {
                // Try radio buttons
                const radios = container.querySelectorAll('input[type="radio"]');
                for (const radio of radios) {
                    const label = radio.closest('label') || radio.parentElement;
                    if (label && label.textContent.includes(answer.content)) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                        Utils.log(`✅ Selected radio: "${answer.content}"`);
                        return;
                    }
                }

                // Try checkboxes
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                for (const checkbox of checkboxes) {
                    const label = checkbox.closest('label') || checkbox.parentElement;
                    if (label && label.textContent.includes(answer.content)) {
                        checkbox.checked = true;
                        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                        Utils.log(`✅ Checked: "${answer.content}"`);
                    }
                }

                // Try dropdowns
                const selects = container.querySelectorAll('select');
                for (const select of selects) {
                    const options = select.querySelectorAll('option');
                    for (const option of options) {
                        if (option.textContent.trim() === answer.content) {
                            select.value = option.value;
                            select.dispatchEvent(new Event('change', { bubbles: true }));
                            Utils.log(`✅ Selected dropdown: "${answer.content}"`);
                            break;
                        }
                    }
                }
            }
        },

        /**
         * Simulate drag and drop operation
         */
        async simulateDragDrop(sourceElement, targetElement) {
            // Get positions
            const sourceRect = sourceElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();

            // Create and dispatch events
            const events = [
                new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    clientX: sourceRect.left + sourceRect.width / 2,
                    clientY: sourceRect.top + sourceRect.height / 2
                }),
                new DragEvent('dragstart', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: new DataTransfer()
                }),
                new DragEvent('dragenter', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: new DataTransfer()
                }),
                new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: new DataTransfer()
                }),
                new DragEvent('drop', {
                    bubbles: true,
                    cancelable: true,
                    dataTransfer: new DataTransfer()
                }),
                new DragEvent('dragend', {
                    bubbles: true,
                    cancelable: true
                }),
                new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    clientX: targetRect.left + targetRect.width / 2,
                    clientY: targetRect.top + targetRect.height / 2
                })
            ];

            // Dispatch on source
            sourceElement.dispatchEvent(events[0]); // mousedown
            sourceElement.dispatchEvent(events[1]); // dragstart

            // Dispatch on target
            targetElement.dispatchEvent(events[2]); // dragenter
            targetElement.dispatchEvent(events[3]); // dragover
            targetElement.dispatchEvent(events[4]); // drop

            // Finish on source
            sourceElement.dispatchEvent(events[5]); // dragend
            sourceElement.dispatchEvent(events[6]); // mouseup

            // If jQuery UI is available, trigger its events
            if (window.$ && window.$.ui) {
                $(sourceElement).trigger('dragstop');
                $(targetElement).trigger('drop');
            }
        }
    };

    // --- MODULE: UI ---
    const UI = {
        root: null,

        init() {
            this.createOverlay();
            this.setupDrag();
        },

        createOverlay() {
            if (document.getElementById('nix-helper-root')) return;

            const div = document.createElement('div');
            div.id = 'nix-helper-root';
            div.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: 450px;
                background: #fff; border: 2px solid #333; border-radius: 10px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 99999;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                font-size: 13px;
            `;

            // Debug input area
            const debugHtml = CONFIG.DEBUG
                ? `
                <div style="padding: 8px; border-bottom: 1px dashed #ccc; background: #f0f0f0;">
                    <button id="nix-btn-debug" style="width:100%;padding:6px;font-size:11px;cursor:pointer;background:#ff9800;color:white;border:none;border-radius:4px;font-weight:bold;">
                        🐞 Debug Mode: Paste JSON
                    </button>
                </div>
            `
                : '';

            div.innerHTML = `
                <div id="nix-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 12px; cursor: move; display: flex; justify-content: space-between; align-items: center; border-radius: 10px 10px 0 0;">
                    <span style="font-weight: bold; font-size: 14px;">🤖 NIX Helper <small style="opacity:0.8">(Stealth)</small></span>
                    <div>
                        <button id="nix-btn-min" style="background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;padding:2px 8px;border-radius:3px;margin-right:5px;">_</button>
                        <button id="nix-btn-close" style="background:rgba(255,0,0,0.6);border:none;color:#fff;cursor:pointer;padding:2px 8px;border-radius:3px;">×</button>
                    </div>
                </div>
                ${debugHtml}
                <div id="nix-content" style="max-height: 450px; overflow-y: auto; padding: 12px; background: #fafafa;">
                    <div style="text-align:center; color: #999; padding: 30px 20px;">
                        <div style="font-size:48px;margin-bottom:10px;">📡</div>
                        <div style="font-weight:bold;margin-bottom:5px;">Waiting for quiz data...</div>
                        <small>Start a quiz or use Debug Mode above</small>
                    </div>
                </div>
                <div id="nix-footer" style="padding: 10px; border-top: 2px solid #eee; display: flex; gap: 8px; background: #f5f5f5; border-radius: 0 0 10px 10px;">
                    <button id="nix-btn-fill" style="flex:1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">
                        🚀 Auto-Fill
                    </button>
                    <button id="nix-btn-copy" style="flex:1; padding: 10px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px;">
                        📋 Copy All
                    </button>
                </div>
            `;

            document.body.appendChild(div);
            this.root = div;

            // Bind events
            div.querySelector('#nix-btn-close').onclick = () => div.remove();
            div.querySelector('#nix-btn-min').onclick = () => {
                const content = div.querySelector('#nix-content');
                const footer = div.querySelector('#nix-footer');
                const debugBar = div.querySelector('#nix-btn-debug')?.parentElement;
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                footer.style.display = isHidden ? 'flex' : 'none';
                if (debugBar) debugBar.style.display = isHidden ? 'block' : 'none';
            };

            div.querySelector('#nix-btn-fill').onclick = () => {
                if (STATE.answers.length === 0) {
                    alert('No answers loaded yet!');
                    return;
                }
                Solver.solve(STATE.answers);
            };

            div.querySelector('#nix-btn-copy').onclick = () => {
                const text = STATE.answers
                    .map(q => {
                        const answerText = q.answers
                            .map(a => {
                                if (q.type === 3) return `${a.content} → pos ${a.targetIndex}`;
                                if (q.type === 5) return `${a.question} → ${a.answer}`;
                                return a.content;
                            })
                            .join('\n');
                        return `Q${q.order}: ${q.title}\n${answerText}`;
                    })
                    .join('\n\n');

                Utils.copyToClipboard(text).then(() => {
                    const btn = div.querySelector('#nix-btn-copy');
                    const orig = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    btn.style.background = '#28a745';
                    setTimeout(() => {
                        btn.textContent = orig;
                        btn.style.background = '#007bff';
                    }, 1500);
                });
            };

            // Debug Event
            if (CONFIG.DEBUG) {
                div.querySelector('#nix-btn-debug').onclick = () => {
                    const json = prompt(
                        '📝 Paste the JSON response from Network tab:\n\n(The entire response from quiz-submission-check-answer endpoint)'
                    );
                    if (json) {
                        try {
                            const answers = Parser.parse(json);
                            if (answers.length === 0) {
                                alert('⚠️ No answers found in JSON. Check the structure.');
                                return;
                            }
                            STATE.answers = answers;
                            UI.renderAnswers(answers);
                            Utils.log(`🐞 Debug: Loaded ${answers.length} questions from manual input.`);
                        } catch (e) {
                            alert('❌ Invalid JSON format!\n\n' + e.message);
                            Utils.error('Debug parse failed:', e);
                        }
                    }
                };
            }
        },

        renderAnswers(answers) {
            const content = this.root.querySelector('#nix-content');
            if (!answers.length) {
                content.innerHTML =
                    '<div style="padding:20px; text-align:center; color:#999;">No answers found in response.</div>';
                return;
            }

            content.innerHTML = answers
                .map(
                    q => `
                <div style="margin-bottom: 12px; padding: 10px; background: white; border-radius: 6px; border-left: 4px solid ${this.getTypeColor(q.type)}; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-weight: bold; margin-bottom: 8px; color: #333; font-size: 14px;">
                        ${this.getTypeIcon(q.type)} Q${q.order}: ${q.title}
                    </div>
                    <div style="font-size:11px;color:#666;margin-bottom:6px;">Type ${q.type} • ${q.answers.length} answer(s)</div>
                    ${this.renderCombinedText(q)}
                    ${q.answers.map(ans => this.renderAnswerItem(q.type, ans)).join('')}
                </div>
            `
                )
                .join('');

            // Bind copy events for combined text
            content.querySelectorAll('.nix-copy-combined').forEach(btn => {
                btn.onclick = e => {
                    const text = e.target.dataset.text;
                    Utils.copyToClipboard(text).then(() => {
                        const orig = e.target.textContent;
                        e.target.textContent = '✅';
                        setTimeout(() => {
                            e.target.textContent = orig;
                        }, 1000);
                    });
                };
            });

            // Update header
            this.root.querySelector('#nix-header span').innerHTML =
                `🤖 NIX Helper <small style="opacity:0.8">(${answers.length} Questions)</small>`;
        },

        /**
         * Get combined text for questions that can be merged
         * - Type 3: Combine ordered items into single string
         * - Type 5: Show answer parts combined
         * - Type 7: Combine fill-in answers
         */
        getCombinedText(questionData) {
            const type = questionData.type;
            const answers = questionData.answers;

            if (type === 3) {
                // Drag & drop ordering: combine in correct order
                return answers.map(a => a.content).join('');
            }

            if (type === 5) {
                // Matching: combine just the answer parts (right side)
                return answers.map(a => a.answer).join(' ');
            }

            if (type === 7) {
                // Fill in blank: combine all answers
                return answers.map(a => a.content).join(' ');
            }

            // For standard types, just combine answers
            if (answers.length > 0) {
                return answers.map(a => a.content).join(' ');
            }

            return null;
        },

        /**
         * Render combined text box with copy button
         * This allows users to hover with dictionary plugins (like 10ten)
         */
        renderCombinedText(questionData) {
            const combined = this.getCombinedText(questionData);
            if (!combined) return '';

            const bgColor = this.getTypeColor(questionData.type) + '20'; // 20% opacity
            const borderColor = this.getTypeColor(questionData.type);

            return `
                <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span class="nix-combined-text" style="flex: 1; font-size: 16px; font-weight: 500; color: #333; user-select: text; cursor: text;" title="Hover để tra từ điển">${combined}</span>
                    <button class="nix-copy-combined" data-text="${combined.replace(/"/g, '&quot;')}" style="background: ${borderColor}; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 11px; white-space: nowrap;">📋 Copy</button>
                </div>
            `;
        },

        renderAnswerItem(type, ans) {
            if (type === 3) {
                return `<div style="background:#fff3cd; padding: 6px 8px; border-left: 3px solid #ffc107; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                    <span style="color:#856404;">#${ans.targetIndex}</span> → <strong style="user-select:text;">${ans.content}</strong>
                    ${ans.reusable ? ' <span style="color:#666;">(Reusable)</span>' : ''}
                </div>`;
            }
            if (type === 4) {
                return `<div style="background:#d1ecf1; padding: 6px 8px; border-left: 3px solid #17a2b8; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                    📍 <strong style="user-select:text;">${ans.content}</strong> at (${ans.coordinates.x}, ${ans.coordinates.y})
                </div>`;
            }
            if (type === 5) {
                return `<div style="background:#d4edda; padding: 6px 8px; border-left: 3px solid #28a745; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                    <span style="color:#666;">${ans.question}</span> → <strong style="user-select:text;">${ans.answer}</strong>
                </div>`;
            }
            if (type === 7) {
                // Dropdown choice shows the correct answer prominently
                if (ans.type === 'dropdown-choice') {
                    return `<div style="background:#e2d9f3; padding: 8px 10px; border-left: 3px solid #6f42c1; margin: 4px 0; border-radius: 3px; font-size: 13px;">
                        ✅ <strong style="user-select:text;">${ans.content}</strong>
                    </div>`;
                }
                // Regular text fill-in
                return `<div style="background:#e2d9f3; padding: 6px 8px; border-left: 3px solid #6f42c1; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                    <span style="color:#666;">[${ans.order}]</span> <strong style="user-select:text;">${ans.content}</strong>
                </div>`;
            }
            return `<div style="background:#e7f3ff; padding: 6px 8px; border-left: 3px solid #007bff; margin: 4px 0; border-radius: 3px; font-size: 12px;">
                ✓ <span style="user-select:text;">${ans.content}</span>
            </div>`;
        },

        getTypeColor(type) {
            const colors = {
                3: '#ffc107',
                4: '#17a2b8',
                5: '#28a745',
                7: '#6f42c1'
            };
            return colors[type] || '#007bff';
        },

        getTypeIcon(type) {
            const icons = {
                3: '🎯',
                4: '📐',
                5: '🔗',
                7: '✍️'
            };
            return icons[type] || '📝';
        },

        setupDrag() {
            const header = this.root.querySelector('#nix-header');
            let isDragging = false,
                startX,
                startY,
                initLeft,
                initTop;

            header.onmousedown = e => {
                if (e.target.tagName === 'BUTTON') return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = this.root.getBoundingClientRect();
                initLeft = rect.left;
                initTop = rect.top;
                header.style.cursor = 'grabbing';
            };

            document.onmousemove = e => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                this.root.style.left = `${initLeft + dx}px`;
                this.root.style.top = `${initTop + dy}px`;
                this.root.style.right = 'auto';
            };

            document.onmouseup = () => {
                isDragging = false;
                header.style.cursor = 'move';
            };
        }
    };

    // --- MODULE: NETWORK (Interceptor) ---
    const Network = {
        init() {
            this.hookXHR();
            this.hookFetch();
            Utils.log('✅ Network interceptors initialized (stealth mode).');
        },

        processResponse(url, responseText) {
            if (url.includes('quiz-submission-check-answer')) {
                Utils.log('🎯 Quiz response intercepted!');
                const answers = Parser.parse(responseText);
                if (answers.length > 0) {
                    STATE.answers = answers;
                    UI.renderAnswers(answers);
                    Utils.log(`📊 Extracted ${answers.length} questions.`);
                }
            }
        },

        hookXHR() {
            const originalOpen = XMLHttpRequest.prototype.open;
            const originalSend = XMLHttpRequest.prototype.send;

            XMLHttpRequest.prototype.open = function (method, url) {
                this._nixUrl = url;
                return originalOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function () {
                this.addEventListener('load', function () {
                    if (this.status === 200 && this._nixUrl) {
                        Network.processResponse(this._nixUrl, this.responseText);
                    }
                });
                return originalSend.apply(this, arguments);
            };
        },

        hookFetch() {
            const originalFetch = window.fetch;
            window.fetch = async function (...args) {
                const response = await originalFetch.apply(this, args);
                const url = args[0] instanceof Request ? args[0].url : args[0];

                if (response.ok && typeof url === 'string' && url.includes('quiz-submission-check-answer')) {
                    try {
                        const clone = response.clone();
                        const text = await clone.text();
                        Network.processResponse(url, text);
                    } catch (e) {
                        Utils.error('Fetch intercept failed', e);
                    }
                }
                return response;
            };
        }
    };

    // --- BOOTSTRAP ---
    function start() {
        Utils.log('🚀 NIX Helper initializing...');
        Utils.log('⚠️ Stealth Mode: No global variables exposed.');
        UI.init();
        Network.init();
        Utils.log('✅ Ready! Open a quiz or use Debug Mode.');
    }

    // Start immediately
    start();
})();
