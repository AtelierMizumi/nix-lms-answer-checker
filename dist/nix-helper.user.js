// ==UserScript==
// @name         NIX Digital LMS Answer Helper
// @namespace    https://github.com/AtelierMizumi/nix-lms-answer-checker
// @version      2.2.0
// @description  Extract and display answers from NIX Digital LMS quizzes
// @author       AtelierMizumi
// @match        *://digital.nix.edu.vn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nix.edu.vn
// @grant        GM_setClipboard
// @grant        GM_notification
// @run-at       document-idle
// @license      MIT
// @homepage     https://github.com/AtelierMizumi/nix-lms-answer-checker
// @supportURL   https://github.com/AtelierMizumi/nix-lms-answer-checker/issues
// @updateURL    https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js
// @downloadURL  https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js
// ==/UserScript==

/**
 * NIX Digital LMS Answer Extractor - Stealth & Modular Version
 *
 * ARCHITECTURE NOTES:
 * 1. Fully encapsulated in IIFE to prevent global scope pollution (Anti-cheat evasion).
 * 2. Modular design: Network, Parser, Solver, UI, Utils.
 * 3. Strategy Pattern for different question types (Type 3, 4, 5, 7).
 * 4. Safe DOM manipulation and Event simulation.
 * 5. Compact UI with a persisted auto-fill preference.
 */

(function () {
    'use strict';

    // --- CONFIGURATION & STATE ---
    const CONFIG = {
        AUTO_FILL_DELAY: 500, // ms
        AUTO_FILL_STORAGE_KEY: 'nix-helper-auto-fill',
        SELECTORS: {
            QUESTION_CONTAINER: '.question-container, .questions', // Generic container
            // Type 3 - actual DOM selectors from Nix LMS
            TYPE_3_DROP_ZONE: '.droppable-zone-question',
            TYPE_3_DRAGGABLE: '.answer-text.ui-draggable',
            TYPE_3_ANSWER_POOL: '.droppable-zone-answer'
        }
    };

    const STATE = {
        answers: [],
        isAutoCompleting: false,
        uiVisible: true,
        autoFillEnabled: false
    };

    // --- MODULE: UTILS ---
    const Utils = {
        log(...args) {
            console.log('[NIX Helper]', ...args);
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

        loadAutoFillPreference() {
            try {
                return window.localStorage.getItem(CONFIG.AUTO_FILL_STORAGE_KEY) === 'true';
            } catch (_e) {
                return false;
            }
        },

        saveAutoFillPreference(enabled) {
            try {
                window.localStorage.setItem(CONFIG.AUTO_FILL_STORAGE_KEY, String(enabled));
            } catch (_e) {
                /* Storage can be unavailable in restricted browser contexts. */
            }
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
                    // Step 1: Build a map of correct_index -> answer content
                    const answerByIndex = new Map();
                    q.answers.forEach(ans => {
                        if (ans.draggable_answer && ans.draggable_answer.correct_index != null) {
                            answerByIndex.set(ans.draggable_answer.correct_index, {
                                content: this.cleanHtml(ans.content),
                                reusable: ans.draggable_answer.reusable === 1
                            });
                        }
                    });

                    // Step 2: Parse [[n]] pattern from question content to get physical positions
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
                                targetIndex: physicalPosition, // Physical slot position
                                placeholderNum: placeholderNum, // Original [[n]] number
                                reusable: answerInfo.reusable,
                                type: 'drag-order'
                            });
                        }
                        physicalPosition++;
                    }

                    // Fallback: if no [[n]] pattern found, use old method
                    if (result.answers.length === 0) {
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
                        const cleanedContent = this.cleanHtml(a.content);
                        const isImageAnswer = a.content && a.content.includes('<img') && !cleanedContent;
                        result.answers.push({
                            content: cleanedContent,
                            rawHtml: a.content, // Preserve raw HTML for image matching
                            answerId: a.id, // Answer ID for precise matching
                            correctIndex: q.answers.indexOf(a), // Index in answer list
                            isImage: isImageAnswer,
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

            // Find drop zones (where answers go) and draggables (source items)
            const dropZones = container.querySelectorAll(CONFIG.SELECTORS.TYPE_3_DROP_ZONE);
            const draggables = container.querySelectorAll(CONFIG.SELECTORS.TYPE_3_DRAGGABLE);

            Utils.log(`📋 Found ${dropZones.length} drop zones, ${draggables.length} draggables`);

            if (dropZones.length === 0) {
                Utils.log('⚠️ No drop zones found');
                return;
            }

            // Build a map of available draggable items
            const draggableMap = new Map();
            draggables.forEach(drag => {
                const content = drag.getAttribute('data-content') || drag.textContent.trim();
                const isReusable = drag.getAttribute('data-reusable') === '1';
                if (!draggableMap.has(content) || isReusable) {
                    draggableMap.set(content, { element: drag, reusable: isReusable, used: false });
                }
            });

            for (const answer of questionData.answers) {
                const targetIndex = answer.targetIndex - 1; // Convert to 0-indexed
                const targetZone = dropZones[targetIndex];

                if (!targetZone) {
                    Utils.log(`⚠️ Drop zone not found for index: ${answer.targetIndex}`);
                    continue;
                }

                // Find the matching draggable
                const draggableInfo = draggableMap.get(answer.content);
                if (!draggableInfo) {
                    Utils.log(`⚠️ Draggable not found for: "${answer.content}"`);
                    continue;
                }

                // Method 1: Try jQuery UI simulation if available
                if (typeof $ !== 'undefined' && $(draggableInfo.element).data('ui-draggable')) {
                    await this.simulateJQueryDragDrop(draggableInfo.element, targetZone, answer.content);
                } else {
                    // Method 2: Direct DOM manipulation fallback
                    await this.directDragDropFill(draggableInfo.element, targetZone, answer.content);
                }

                Utils.log(`✅ [${answer.targetIndex}] Filled: "${answer.content}"`);

                // Mark non-reusable items as used
                if (!draggableInfo.reusable) {
                    draggableInfo.used = true;
                }

                await new Promise(r => setTimeout(r, 150));
            }
        },

        async simulateJQueryDragDrop(draggable, dropZone, content) {
            try {
                const $draggable = $(draggable);
                const $dropZone = $(dropZone);

                // Clone for reusable or move for non-reusable
                const isReusable = draggable.getAttribute('data-reusable') === '1';
                const $element = isReusable ? $draggable.clone() : $draggable;

                // Trigger jQuery UI events
                $dropZone.trigger(
                    $.Event('drop', {
                        target: dropZone,
                        originalEvent: { dataTransfer: { getData: () => content } }
                    })
                );

                // Set content in drop zone
                $element.appendTo($dropZone);
                $dropZone.addClass('filled');

                // Trigger change event
                $dropZone.trigger('change');
            } catch (e) {
                Utils.log(`jQuery simulation failed, falling back: ${e.message}`);
                await this.directDragDropFill(draggable, dropZone, content);
            }
        },

        async directDragDropFill(draggable, dropZone, content) {
            // Direct DOM manipulation for jQuery UI drop zones
            const isReusable = draggable.getAttribute('data-reusable') === '1';

            // Clone the draggable element
            const clone = draggable.cloneNode(true);
            clone.classList.remove('ui-draggable-handle');
            clone.style.position = 'relative';
            clone.style.left = '0';
            clone.style.top = '0';

            // Clear and fill the drop zone
            dropZone.innerHTML = '';
            dropZone.appendChild(clone);
            dropZone.classList.add('filled');
            dropZone.classList.remove('quiz-answer-wrong');

            // Hide original if not reusable
            if (!isReusable) {
                draggable.style.visibility = 'hidden';
                draggable.style.position = 'absolute';
            }

            // Dispatch events to notify the page
            dropZone.dispatchEvent(new Event('change', { bubbles: true }));
            dropZone.dispatchEvent(new Event('drop', { bubbles: true, detail: { content } }));
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
                // Handle dropdown-choice (select dropdown by order)
                if (answer.type === 'dropdown-choice') {
                    const dropdownIndex = answer.order - 1; // order is 1-indexed
                    const answerText = answer.content.trim();
                    Utils.log(`🔍 [Blank ${answer.order}] Looking for: "${answerText}"`);

                    let found = false;

                    // Method 1: Standard <select> dropdowns
                    const selects = container.querySelectorAll('select');
                    if (selects[dropdownIndex]) {
                        const select = selects[dropdownIndex];
                        for (const option of select.querySelectorAll('option')) {
                            const optionText = option.textContent.trim();
                            if (
                                optionText === answerText ||
                                optionText.includes(answerText) ||
                                answerText.includes(optionText)
                            ) {
                                select.value = option.value;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                Utils.log(`✅ [Blank ${answer.order}] Selected dropdown: "${optionText}"`);
                                found = true;
                                break;
                            }
                        }
                    }

                    // Method 2: Radio buttons - find by text content match
                    if (!found) {
                        const allRadios = container.querySelectorAll('input[type="radio"]');
                        for (const radio of allRadios) {
                            // Check multiple possible text containers
                            const label = radio.closest('label') || radio.parentElement;
                            const row = radio.closest('.d-flex, .row, .form-group, .answer-option, li, .form-check');
                            const textContent = (row?.textContent || label?.textContent || '').trim();

                            if (textContent.includes(answerText) || answerText.includes(textContent)) {
                                radio.checked = true;
                                radio.click();
                                radio.dispatchEvent(new Event('change', { bubbles: true }));
                                Utils.log(`✅ [Blank ${answer.order}] Selected radio: "${answerText}"`);
                                found = true;
                                break;
                            }
                        }
                    }

                    // Method 3: Custom dropdown buttons (Bootstrap/custom UI)
                    if (!found) {
                        const dropdownItems = container.querySelectorAll(
                            '.dropdown-item, .dropdown-menu a, .dropdown-menu button, [data-value]'
                        );
                        for (const item of dropdownItems) {
                            const itemText = item.textContent.trim();
                            if (itemText === answerText || itemText.includes(answerText)) {
                                item.click();
                                Utils.log(`✅ [Blank ${answer.order}] Clicked dropdown item: "${itemText}"`);
                                found = true;
                                break;
                            }
                        }
                    }

                    // Method 4: Button groups or clickable options
                    if (!found) {
                        const buttons = container.querySelectorAll('button, .btn, [role="option"], .option, .choice');
                        for (const btn of buttons) {
                            const btnText = btn.textContent.trim();
                            if (btnText === answerText || btnText.includes(answerText)) {
                                btn.click();
                                Utils.log(`✅ [Blank ${answer.order}] Clicked button: "${btnText}"`);
                                found = true;
                                break;
                            }
                        }
                    }

                    if (!found) {
                        Utils.log(`⚠️ [Blank ${answer.order}] Could not find element for: "${answerText}"`);
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
                const radioArray = Array.from(radios);

                // Method 1: Image-based answer - match by index
                if (answer.isImage && answer.correctIndex !== undefined) {
                    const targetRadio = radioArray[answer.correctIndex];
                    if (targetRadio) {
                        targetRadio.checked = true;
                        targetRadio.click();
                        targetRadio.dispatchEvent(new Event('change', { bubbles: true }));
                        Utils.log(`✅ Selected image radio at index ${answer.correctIndex}`);
                        return;
                    }
                }

                // Method 2: Image match by src in rawHtml
                if (answer.rawHtml && answer.rawHtml.includes('<img')) {
                    const srcMatch = answer.rawHtml.match(/src=["']([^"']+)["']/);
                    if (srcMatch) {
                        const imgSrc = srcMatch[1];
                        for (const radio of radioArray) {
                            const label = radio.closest('label') || radio.parentElement;
                            const img = label?.querySelector('img');
                            if (img && img.src.includes(imgSrc.split('/').pop())) {
                                radio.checked = true;
                                radio.click();
                                radio.dispatchEvent(new Event('change', { bubbles: true }));
                                Utils.log('✅ Selected radio by image src match');
                                return;
                            }
                        }
                    }
                }

                // Method 3: Text-based matching (original logic)
                for (const radio of radioArray) {
                    const label = radio.closest('label') || radio.parentElement;
                    if (label && answer.content && label.textContent.includes(answer.content)) {
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
            STATE.autoFillEnabled = Utils.loadAutoFillPreference();
            this.createOverlay();
            this.setupDrag();
        },

        createOverlay() {
            if (document.getElementById('nix-helper-root')) return;

            const div = document.createElement('div');
            div.id = 'nix-helper-root';
            div.style.cssText = `
                position: fixed; top: 20px; right: 20px; width: min(390px, calc(100vw - 32px));
                background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.22); z-index: 99999;
                font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 13px; color: #1e293b; overflow: hidden;
            `;

            div.innerHTML = `
                <div id="nix-header" style="background: linear-gradient(135deg, #0f766e, #155e75); color: #fff; padding: 15px 16px; cursor: move; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 750; font-size: 15px; letter-spacing: 0.01em;">NIX Helper <small style="display:block;opacity:0.72;font-size:11px;font-weight:500;margin-top:2px;">Đáp án quiz</small></span>
                    <div style="display:flex;gap:6px;">
                        <button id="nix-btn-min" aria-label="Thu nhỏ" title="Thu nhỏ" style="width:30px;height:30px;background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.25);color:#fff;cursor:pointer;border-radius:7px;font-size:16px;line-height:1;">−</button>
                        <button id="nix-btn-close" aria-label="Đóng" title="Đóng" style="width:30px;height:30px;background:rgba(15,23,42,0.22);border:1px solid rgba(255,255,255,0.25);color:#fff;cursor:pointer;border-radius:7px;font-size:18px;line-height:1;">×</button>
                    </div>
                </div>
                <div id="nix-content" style="max-height: 430px; overflow-y: auto; padding: 14px; background: #f8fafc;">
                    <div style="text-align:center; color: #64748b; padding: 34px 20px 30px;">
                        <div style="font-size:34px;margin-bottom:12px;">◌</div>
                        <div style="font-weight:700;margin-bottom:6px;color:#334155;">Đang chờ kết quả</div>
                        <small>Thực hiện Check Answer để nhận đáp án.</small>
                    </div>
                </div>
                <div id="nix-footer" style="padding: 12px 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px; background: #fff;">
                    <div>
                        <div style="font-weight:700;color:#334155;">Tự động điền đáp án</div>
                        <small id="nix-setting-status" style="color:#64748b;">${STATE.autoFillEnabled ? 'Đang bật' : 'Đang tắt'}</small>
                    </div>
                    <label style="position:relative;width:46px;height:26px;display:block;flex:0 0 auto;cursor:pointer;">
                        <input id="nix-auto-fill-toggle" type="checkbox" ${STATE.autoFillEnabled ? 'checked' : ''} aria-label="Bật tự động điền đáp án" style="opacity:0;width:0;height:0;position:absolute;">
                        <span style="position:absolute;inset:0;background:${STATE.autoFillEnabled ? '#0f766e' : '#cbd5e1'};border-radius:999px;transition:background .2s;"></span>
                        <span id="nix-toggle-knob" style="position:absolute;width:20px;height:20px;left:${STATE.autoFillEnabled ? '23px' : '3px'};top:3px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(15,23,42,.25);transition:left .2s;"></span>
                    </label>
                </div>
            `;

            document.body.appendChild(div);
            this.root = div;

            // Bind events
            div.querySelector('#nix-btn-close').onclick = () => div.remove();
            div.querySelector('#nix-btn-min').onclick = () => {
                const content = div.querySelector('#nix-content');
                const footer = div.querySelector('#nix-footer');
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                footer.style.display = isHidden ? 'flex' : 'none';
            };

            div.querySelector('#nix-auto-fill-toggle').onchange = event => {
                STATE.autoFillEnabled = event.target.checked;
                Utils.saveAutoFillPreference(STATE.autoFillEnabled);
                this.updateAutoFillToggle();
                if (!STATE.autoFillEnabled) {
                    STATE.isAutoCompleting = false;
                } else if (STATE.answers.length > 0 && !STATE.isAutoCompleting) {
                    Solver.solve(STATE.answers);
                }
            };
        },

        updateAutoFillToggle() {
            const toggle = this.root?.querySelector('#nix-auto-fill-toggle');
            const status = this.root?.querySelector('#nix-setting-status');
            const track = toggle?.nextElementSibling;
            const knob = this.root?.querySelector('#nix-toggle-knob');
            if (!toggle || !status || !track || !knob) return;
            toggle.checked = STATE.autoFillEnabled;
            status.textContent = STATE.autoFillEnabled ? 'Đang bật' : 'Đang tắt';
            track.style.background = STATE.autoFillEnabled ? '#0f766e' : '#cbd5e1';
            knob.style.left = STATE.autoFillEnabled ? '23px' : '3px';
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

            // Update header
            this.root.querySelector('#nix-header span').innerHTML =
                `NIX Helper <small style="display:block;opacity:0.72;font-size:11px;font-weight:500;margin-top:2px;">${answers.length} câu hỏi</small>`;
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
         * Render a prominent combined answer preview.
         */
        renderCombinedText(questionData) {
            const combined = this.getCombinedText(questionData);
            if (!combined) return '';

            const bgColor = this.getTypeColor(questionData.type) + '20'; // 20% opacity
            const borderColor = this.getTypeColor(questionData.type);

            return `
                <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span class="nix-combined-text" style="flex: 1; font-size: 16px; font-weight: 600; color: #1e293b; user-select: text; cursor: text;" title="Bôi đen để tra từ điển">${combined}</span>
                </div>
            `;
        },

        renderAnswerItem(type, ans) {
            if (type === 3) {
                return `<div style="background:#fff7ed; padding: 7px 9px; border-left: 3px solid #f59e0b; margin: 5px 0; border-radius: 5px; font-size: 12px;">
                    <span style="color:#9a3412;font-weight:700;">#${ans.targetIndex}</span> → <strong style="user-select:text;">${ans.content}</strong>
                    ${ans.reusable ? ' <span style="color:#64748b;">(Reusable)</span>' : ''}
                </div>`;
            }
            if (type === 4) {
                return `<div style="background:#ecfeff; padding: 7px 9px; border-left: 3px solid #0891b2; margin: 5px 0; border-radius: 5px; font-size: 12px;">
                    📍 <strong style="user-select:text;">${ans.content}</strong> at (${ans.coordinates.x}, ${ans.coordinates.y})
                </div>`;
            }
            if (type === 5) {
                return `<div style="background:#ecfdf5; padding: 7px 9px; border-left: 3px solid #059669; margin: 5px 0; border-radius: 5px; font-size: 12px;">
                    <span style="color:#475569;">${ans.question}</span> → <strong style="user-select:text;">${ans.answer}</strong>
                </div>`;
            }
            if (type === 7) {
                // Dropdown choice shows the correct answer prominently
                if (ans.type === 'dropdown-choice') {
                    return `<div style="background:#f0fdfa; padding: 8px 10px; border-left: 3px solid #0f766e; margin: 5px 0; border-radius: 5px; font-size: 13px;">
                        ✅ <strong style="user-select:text;">${ans.content}</strong>
                    </div>`;
                }
                // Regular text fill-in
                return `<div style="background:#f0fdfa; padding: 7px 9px; border-left: 3px solid #0f766e; margin: 5px 0; border-radius: 5px; font-size: 12px;">
                    <span style="color:#475569;">[${ans.order}]</span> <strong style="user-select:text;">${ans.content}</strong>
                </div>`;
            }
            return `<div style="background:#eff6ff; padding: 7px 9px; border-left: 3px solid #2563eb; margin: 5px 0; border-radius: 5px; font-size: 12px;">
                ✓ <span style="user-select:text;">${ans.content}</span>
            </div>`;
        },

        getTypeColor(type) {
            const colors = {
                3: '#f59e0b',
                4: '#0891b2',
                5: '#059669',
                7: '#0f766e'
            };
            return colors[type] || '#2563eb';
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
                    if (STATE.autoFillEnabled && !STATE.isAutoCompleting) {
                        Solver.solve(answers);
                    }
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
        Utils.log('✅ Ready! Waiting for quiz answers.');
    }

    // Start immediately
    start();
})();
