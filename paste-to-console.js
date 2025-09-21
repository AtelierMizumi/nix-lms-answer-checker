// NIX Digital LMS Answer Extractor - Enhanced UI Version with Auto-Complete
// Copy và paste dòng này vào Console:

(function () {
    const o = window.XMLHttpRequest, f = window.fetch;
    let nixPopup = null, isDragging = false, startX = 0, startY = 0, offsetX = 0, offsetY = 0, autoCompleteEnabled = false, currentAnswers = [];

    function e(d) {
        const a = [];
        try {
            const r = typeof d === 'string' ? JSON.parse(d) : d;

            // Handle new JSON structure with questions array
            if (r.questions && Array.isArray(r.questions)) {
                r.questions.forEach((q, i) => {
                    const qd = q.question;
                    if (qd) {
                        let correctAnswers = [];

                        // Type 5: Matching questions
                        if (qd.type === 5 && qd.matching_answers) {
                            qd.matching_answers.forEach(match => {
                                const answer = qd.answers.find(ans => ans.id === match.answer_id);
                                if (answer && match.answer_matching) {
                                    correctAnswers.push({
                                        question: answer.content.replace(/<\/?[^>]+(>|$)/g, "").trim(), // Remove HTML tags
                                        answer: match.answer_matching.trim()
                                    });
                                }
                            });
                        }
                        // Type 7: Short answer/Fill in the blank questions
                        else if (qd.type === 7 && qd.answers) {
                            qd.answers.forEach((answer, idx) => {
                                try {
                                    const answerData = JSON.parse(answer.content);
                                    if (answerData.type === 'short-answer' && answerData.child_answers) {
                                        answerData.child_answers.forEach(childAnswer => {
                                            if (childAnswer.content) {
                                                correctAnswers.push({
                                                    content: childAnswer.content,
                                                    order: idx + 1,
                                                    type: 'short-answer'
                                                });
                                            }
                                        });
                                    } else if (answerData.type === 'single-choice' && answerData.child_answers && answerData.correctAnswerIndex !== null) {
                                        const correctChild = answerData.child_answers[answerData.correctAnswerIndex];
                                        if (correctChild) {
                                            correctAnswers.push({
                                                content: correctChild.content,
                                                order: idx + 1,
                                                type: 'single-choice'
                                            });
                                        }
                                    }
                                } catch (e) {
                                    console.error('Error parsing type 7 answer content:', e);
                                }
                            });
                        }
                        // Type 3: Drag & drop with correct_index
                        else if (qd.type === 3 && q.answer_display) {
                            try {
                                const correctOrderIds = JSON.parse(q.answer_display);
                                if (Array.isArray(correctOrderIds)) {
                                    correctOrderIds.forEach((answerId, index) => {
                                        const answer = qd.answers.find(ans => ans.id === answerId);
                                        if (answer && answer.draggable_answer) {
                                            correctAnswers.push({
                                                content: answer.content.trim(),
                                                order: index + 1,
                                                correctIndex: answer.draggable_answer.correct_index
                                            });
                                        }
                                    });
                                }
                            } catch (e) {
                                console.error('Error parsing type 3 answer_display:', e);
                            }
                        }
                        // Type 4: Drag & drop questions (sắp xếp) - New structure
                        else if (qd.type === 4 && q.answer_display) {
                            try {
                                // Parse answer_display to get correct order - it's an array of answer IDs
                                const correctOrderIds = JSON.parse(q.answer_display);
                                if (Array.isArray(correctOrderIds)) {
                                    // Map answer IDs to actual answers with coordinates
                                    const answersWithCoords = [];
                                    correctOrderIds.forEach(answerId => {
                                        const answer = qd.answers.find(ans => ans.id === answerId);
                                        if (answer && answer.draggable_answer && answer.draggable_answer.coordinates) {
                                            const coord = answer.draggable_answer.coordinates[0]; // Get first coordinate
                                            answersWithCoords.push({
                                                content: answer.content.trim(),
                                                x: coord.x,
                                                y: coord.y,
                                                answerId: answerId
                                            });
                                        }
                                    });

                                    // Sort by x-coordinate for proper ordering
                                    answersWithCoords.sort((a, b) => a.x - b.x);

                                    answersWithCoords.forEach((item, index) => {
                                        correctAnswers.push({
                                            content: item.content,
                                            order: index,
                                            coordinates: { x: item.x, y: item.y }
                                        });
                                    });
                                }
                            } catch (e) {
                                console.error('Error parsing answer_display:', e);
                            }
                        }
                        // Regular questions with correct === 1
                        else if (qd.answers) {
                            const ca = qd.answers.filter(ans => ans.correct === 1).map(ans => ans.content);
                            if (ca.length > 0) {
                                correctAnswers = ca;
                            }
                        }

                        if (correctAnswers.length > 0) {
                            a.push({
                                order: i + 1,
                                questionId: qd.id,
                                title: qd.title,
                                correctAnswers: correctAnswers,
                                questionType: qd.type || 'unknown'
                            });
                        }
                    }
                });
            }
            // Handle old JSON structure (for backwards compatibility)
            else if (r.answers) {
                // Old structure handling code here if needed
                console.log('🔄 Using legacy JSON structure');
            }
        } catch (err) {
            console.error('❌ Parse error:', err)
        }
        return a
    }

    function autoFillAnswers(answers) {
        if (!autoCompleteEnabled) return;
        console.log('🤖 Auto-filling answers...');

        answers.forEach((ans, idx) => {
            setTimeout(() => {
                const questionDiv = document.querySelector(`[data-id="${ans.questionId}"]`) || document.querySelector(`.questions:nth-child(${idx + 1})`);
                if (!questionDiv) {
                    console.log(`⚠️ Question div not found for: ${ans.title}`);
                    return;
                }

                console.log(`🎯 Processing question ${ans.order}:`, ans.title);

                // Handle Type 5: Matching questions
                if (ans.questionType === 5 && Array.isArray(ans.correctAnswers)) {
                    ans.correctAnswers.forEach((match, matchIdx) => {
                        if (match.question && match.answer) {
                            const selects = questionDiv.querySelectorAll('select.answer-matching');
                            selects.forEach(select => {
                                // Find the select that corresponds to this question part
                                const parentRow = select.closest('.d-flex');
                                if (parentRow) {
                                    const questionText = parentRow.querySelector('.col-7')?.textContent?.trim();
                                    if (questionText && (questionText.includes(match.question) || match.question.includes(questionText))) {
                                        const options = select.querySelectorAll('option');
                                        options.forEach(option => {
                                            const optionText = option.textContent.trim();
                                            if (optionText === match.answer || optionText.includes(match.answer) || match.answer.includes(optionText)) {
                                                select.value = option.value;
                                                // Trigger Select2 change events
                                                if (window.$ && $(select).data('select2')) {
                                                    $(select).trigger('change');
                                                } else {
                                                    select.dispatchEvent(new Event('change'));
                                                }
                                                console.log(`✅ Set matching dropdown: ${match.question} -> ${match.answer}`);
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                // Handle Type 4: Drag & drop questions
                else if (ans.questionType === 4 && Array.isArray(ans.correctAnswers)) {
                    const dragArea = questionDiv.querySelector('.image-area-container');
                    if (dragArea) {
                        console.log(`🎯 Found drag area, processing ${ans.correctAnswers.length} items`);

                        ans.correctAnswers.forEach((item, itemIdx) => {
                            if (item.content && item.coordinates) {
                                // Find draggable element with matching content - try multiple approaches
                                const draggables = dragArea.querySelectorAll('.draggable');
                                console.log(`🔍 Looking for draggable: "${item.content}"`);
                                console.log(`🔍 Available draggables: ${Array.from(draggables).map(d => `"${d.textContent.trim()}"`).join(', ')}`);

                                let foundDrag = null;

                                // Method 1: Try textContent.trim()
                                draggables.forEach(drag => {
                                    const dragText = drag.textContent.trim();
                                    if (dragText === item.content) {
                                        foundDrag = drag;
                                    }
                                });

                                // Method 2: Try data-content attribute if textContent didn't work
                                if (!foundDrag) {
                                    draggables.forEach(drag => {
                                        const dragDataContent = drag.getAttribute('data-content');
                                        if (dragDataContent === item.content) {
                                            foundDrag = drag;
                                        }
                                    });
                                }

                                // Method 3: Try innerHTML.trim() if both above didn't work
                                if (!foundDrag) {
                                    draggables.forEach(drag => {
                                        const dragHTML = drag.innerHTML.trim().replace(/\s+/g, ' ');
                                        if (dragHTML === item.content) {
                                            foundDrag = drag;
                                        }
                                    });
                                }

                                if (foundDrag) {
                                    console.log(`✅ Found draggable element: "${foundDrag.textContent.trim()}"`);

                                    // Set position directly without relative calculations
                                    foundDrag.style.position = 'absolute';
                                    foundDrag.style.left = item.coordinates.x + 'px';
                                    foundDrag.style.top = item.coordinates.y + 'px';
                                    foundDrag.style.zIndex = '1000';

                                    // Force trigger drag events if jQuery UI is available
                                    if (window.$ && $(foundDrag).hasClass('ui-draggable')) {
                                        // Simulate drag events
                                        $(foundDrag).trigger('dragstart');
                                        $(foundDrag).trigger('drag');
                                        $(foundDrag).trigger('dragstop');
                                    }

                                    console.log(`✅ Moved "${item.content}" to (${item.coordinates.x}, ${item.coordinates.y})`);
                                } else {
                                    console.log(`⚠️ Could not find draggable element for: "${item.content}"`);
                                    console.log(`Available elements:`, Array.from(draggables).map(d => ({
                                        textContent: d.textContent.trim(),
                                        dataContent: d.getAttribute('data-content'),
                                        innerHTML: d.innerHTML.trim()
                                    })));
                                }
                            }
                        });
                    } else {
                        console.log(`⚠️ No drag area found for question ${ans.questionId}`);
                    }
                }
                // Handle regular questions (original logic)
                else {
                    ans.correctAnswers.forEach((correctAnswer, ansIdx) => {
                        // Handle Select2 dropdowns (general case)
                        const selects = questionDiv.querySelectorAll('select');
                        selects.forEach((select, selectIdx) => {
                            const options = select.querySelectorAll('option');
                            options.forEach(option => {
                                const optionText = option.textContent.trim();
                                const answerText = correctAnswer.trim();
                                if (optionText === answerText || optionText.includes(answerText) || answerText.includes(optionText)) {
                                    select.value = option.value;
                                    // Trigger Select2 change events
                                    if (window.$ && $(select).data('select2')) {
                                        $(select).trigger('change');
                                    } else {
                                        select.dispatchEvent(new Event('change'));
                                    }
                                    console.log(`✅ Set dropdown ${selectIdx + 1}: ${correctAnswer}`);
                                }
                            });
                        });

                        // Handle drag & drop elements (general case)
                        const dragArea = questionDiv.querySelector('.image-area-container');
                        if (dragArea) {
                            const draggables = dragArea.querySelectorAll('.draggable');
                            const droppables = dragArea.querySelectorAll('.ui-droppable, .static');

                            draggables.forEach(drag => {
                                const dragText = drag.textContent.trim();
                                if (dragText === correctAnswer.trim()) {
                                    droppables.forEach(drop => {
                                        const dropText = drop.textContent.trim();
                                        if (dropText === correctAnswer.trim()) {
                                            // Get positions
                                            const dragRect = drag.getBoundingClientRect();
                                            const dropRect = drop.getBoundingClientRect();
                                            const containerRect = dragArea.getBoundingClientRect();

                                            // Calculate new position relative to container
                                            const newLeft = dropRect.left - containerRect.left;
                                            const newTop = dropRect.top - containerRect.top;

                                            drag.style.left = newLeft + 'px';
                                            drag.style.top = newTop + 'px';
                                            drag.style.zIndex = '1000';

                                            // Trigger UI events if available
                                            if (window.$ && $(drag).hasClass('ui-draggable')) {
                                                $(drag).trigger('dragstop');
                                            }

                                            console.log(`✅ Moved drag element: ${correctAnswer}`);
                                        }
                                    });
                                }
                            });
                        }

                        // Handle multiple choice (radio buttons) 
                        const radioInputs = questionDiv.querySelectorAll('input[type="radio"]');
                        radioInputs.forEach(radio => {
                            const label = radio.closest('label') || radio.parentElement;
                            if (label && (label.textContent.includes(correctAnswer.trim()) || correctAnswer.includes(label.textContent.trim()))) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Selected radio: ${correctAnswer}`);
                            }
                        });

                        // Handle checkboxes 
                        const checkboxes = questionDiv.querySelectorAll('input[type="checkbox"]');
                        checkboxes.forEach(checkbox => {
                            const label = checkbox.closest('label') || checkbox.parentElement;
                            if (label && (label.textContent.includes(correctAnswer.trim()) || correctAnswer.includes(label.textContent.trim()))) {
                                checkbox.checked = true;
                                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Checked: ${correctAnswer}`);
                            }
                        });

                        // Handle text inputs 
                        const textInputs = questionDiv.querySelectorAll('input[type="text"], textarea, input[type="email"], input[type="number"]');
                        textInputs.forEach((input, inputIdx) => {
                            if (inputIdx === ansIdx || textInputs.length === 1) {
                                input.value = correctAnswer;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`✅ Filled text input: ${correctAnswer}`);
                            }
                        });
                    });
                }
            }, idx * 500); // Delay between questions
        });

        setTimeout(() => console.log('🎉 Auto-fill completed!'), answers.length * 500 + 1000);
    }

    function makeDraggable(elem) {
        const header = elem.querySelector('#nixHeader');
        header.style.cursor = 'move';
        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);

        function startDrag(e) {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = elem.getBoundingClientRect();
            offsetX = startX - rect.left;
            offsetY = startY - rect.top;
            elem.style.transition = 'none'
        }

        function drag(e) {
            if (!isDragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            const maxX = window.innerWidth - elem.offsetWidth;
            const maxY = window.innerHeight - elem.offsetHeight;
            elem.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            elem.style.top = Math.max(0, Math.min(y, maxY)) + 'px'
        }

        function stopDrag() {
            isDragging = false;
            elem.style.transition = 'all 0.3s ease'
        }
    }

    function copyToClipboard(text, btn) {
        navigator.clipboard.writeText(text).then(() => {
            const orig = btn.innerHTML;
            btn.innerHTML = '✅';
            btn.style.background = '#198754';
            setTimeout(() => {
                btn.innerHTML = orig;
                btn.style.background = '#6c757d'
            }, 1500)
        }).catch(err => console.log('Copy failed:', err))
    }

    function s(a, c) {
        currentAnswers = a;
        const p = document.getElementById('nixAE');
        if (p) p.remove();

        const n = document.createElement('div');
        n.id = 'nixAE';
        nixPopup = n;
        n.style.cssText = 'position:fixed;top:20px;right:20px;width:500px;max-height:80vh;background:white;border:2px solid #007bff;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:10000;font-family:Arial,sans-serif;font-size:14px;overflow:hidden;transition:all 0.3s ease';

        const h = document.createElement('div');
        h.id = 'nixHeader';
        h.style.cssText = 'background:#007bff;color:white;padding:10px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;user-select:none';

        const leftGroup = document.createElement('div');
        leftGroup.style.cssText = 'display:flex;align-items:center;gap:10px';
        leftGroup.innerHTML = '<span>🎌 Đáp án (' + a.length + ' câu)</span>';

        const toggleVisBtn = document.createElement('button');
        toggleVisBtn.innerHTML = '👁️';
        toggleVisBtn.title = 'Toggle visibility';
        toggleVisBtn.style.cssText = 'background:rgba(255,255,255,0.2);border:none;color:white;font-size:14px;cursor:pointer;padding:4px 8px;border-radius:3px;margin-left:10px';
        toggleVisBtn.onclick = () => {
            nixPopup.style.display = nixPopup.style.display === 'none' ? 'block' : 'none'
        };
        leftGroup.appendChild(toggleVisBtn);

        // Auto-complete toggle button
        const autoBtn = document.createElement('button');
        autoBtn.innerHTML = autoCompleteEnabled ? '🤖' : '🔧';
        autoBtn.title = 'Toggle Auto-Complete';
        autoBtn.style.cssText = 'background:rgba(255,255,255,0.2);border:none;color:white;font-size:14px;cursor:pointer;padding:4px 8px;border-radius:3px;margin-left:5px';
        autoBtn.onclick = () => {
            autoCompleteEnabled = !autoCompleteEnabled;
            autoBtn.innerHTML = autoCompleteEnabled ? '🤖' : '🔧';
            autoBtn.style.background = autoCompleteEnabled ? 'rgba(0,255,0,0.3)' : 'rgba(255,255,255,0.2)';
            console.log(autoCompleteEnabled ? '✅ Auto-Complete ENABLED' : '⚠️ Auto-Complete DISABLED');
        };
        leftGroup.appendChild(autoBtn);

        const rightGroup = document.createElement('div');
        rightGroup.style.cssText = 'display:flex;align-items:center;gap:5px';

        const fillBtn = document.createElement('button');
        fillBtn.innerHTML = '🚀';
        fillBtn.title = 'Auto-Fill Now';
        fillBtn.style.cssText = 'background:rgba(255,255,255,0.2);border:none;color:white;font-size:14px;cursor:pointer;padding:4px 8px;border-radius:3px';
        fillBtn.onclick = () => {
            autoFillAnswers(currentAnswers);
        };
        rightGroup.appendChild(fillBtn);

        const minimizeBtn = document.createElement('button');
        minimizeBtn.innerHTML = '➖';
        minimizeBtn.style.cssText = 'background:none;border:none;color:white;font-size:16px;cursor:pointer;padding:2px 6px';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:18px;cursor:pointer;padding:2px 6px';

        rightGroup.appendChild(minimizeBtn);
        rightGroup.appendChild(closeBtn);
        h.appendChild(leftGroup);
        h.appendChild(rightGroup);

        const content = document.createElement('div');
        content.id = 'nixContent';
        content.style.cssText = 'transition:all 0.3s ease;overflow:hidden';

        const ct = document.createElement('div');
        ct.style.cssText = 'max-height:60vh;overflow-y:auto;padding:15px';
        ct.innerHTML = a.map(i => {
            let answersHtml = '';

            if (i.questionType === 5) {
                // Matching questions - show question -> answer pairs
                answersHtml = i.correctAnswers.map((match, idx) =>
                    `<div style="margin:8px 0;padding:8px;background:white;border-left:3px solid #28a745;border-radius:4px;position:relative;font-size:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                            <span style="flex:1;line-height:1.4;">
                                <strong>${match.question}</strong> → ${match.answer}
                            </span>
                            <button onclick="(function(){navigator.clipboard.writeText('${match.answer.replace(/'/g, "\\'")}').then(()=>{this.innerHTML='✅';this.style.background='#198754';setTimeout(()=>{this.innerHTML='📋';this.style.background='#6c757d'},1500)})}).call(this)" style="background:#6c757d;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;min-width:30px;">📋</button>
                        </div>
                    </div>`
                ).join('');
            } else if (i.questionType === 4) {
                // Drag & drop questions - show content and position
                answersHtml = i.correctAnswers.map((item, idx) =>
                    `<div style="margin:8px 0;padding:8px;background:white;border-left:3px solid #ffc107;border-radius:4px;position:relative;font-size:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                            <span style="flex:1;line-height:1.4;">
                                ${idx + 1}. ${item.content} <small style="color:#666;">(${item.coordinates.x}, ${item.coordinates.y})</small>
                            </span>
                            <button onclick="(function(){navigator.clipboard.writeText('${item.content.replace(/'/g, "\\'")}').then(()=>{this.innerHTML='✅';this.style.background='#198754';setTimeout(()=>{this.innerHTML='📋';this.style.background='#6c757d'},1500)})}).call(this)" style="background:#6c757d;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;min-width:30px;">📋</button>
                        </div>
                    </div>`
                ).join('');
            } else if (i.questionType === 7) {
                // Type 7: Short answer questions
                answersHtml = i.correctAnswers.map((item, idx) =>
                    `<div style="margin:8px 0;padding:8px;background:white;border-left:3px solid #17a2b8;border-radius:4px;position:relative;font-size:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                            <span style="flex:1;line-height:1.4;">
                                ${item.order}. ${item.content} <small style="color:#666;">(${item.type})</small>
                            </span>
                            <button onclick="(function(){navigator.clipboard.writeText('${item.content.replace(/'/g, "\\'")}').then(()=>{this.innerHTML='✅';this.style.background='#198754';setTimeout(()=>{this.innerHTML='📋';this.style.background='#6c757d'},1500)})}).call(this)" style="background:#6c757d;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;min-width:30px;">📋</button>
                        </div>
                    </div>`
                ).join('');
            } else if (i.questionType === 3) {
                // Type 3: Drag & drop with ordering
                answersHtml = i.correctAnswers.map((item, idx) =>
                    `<div style="margin:8px 0;padding:8px;background:white;border-left:3px solid #dc3545;border-radius:4px;position:relative;font-size:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                            <span style="flex:1;line-height:1.4;">
                                ${item.order}. ${item.content} <small style="color:#666;">(index: ${item.correctIndex})</small>
                            </span>
                            <button onclick="(function(){navigator.clipboard.writeText('${item.content.replace(/'/g, "\\'")}').then(()=>{this.innerHTML='✅';this.style.background='#198754';setTimeout(()=>{this.innerHTML='📋';this.style.background='#6c757d'},1500)})}).call(this)" style="background:#6c757d;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;min-width:30px;">📋</button>
                        </div>
                    </div>`
                ).join('');
            } else {
                // Regular questions
                answersHtml = i.correctAnswers.map((ans, idx) =>
                    `<div style="margin:8px 0;padding:8px;background:white;border-left:3px solid #28a745;border-radius:4px;position:relative;font-size:16px;">
                        <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                            <span style="flex:1;line-height:1.4;">${ans}</span>
                            <button onclick="(function(){navigator.clipboard.writeText('${ans.replace(/'/g, "\\'")}').then(()=>{this.innerHTML='✅';this.style.background='#198754';setTimeout(()=>{this.innerHTML='📋';this.style.background='#6c757d'},1500)})}).call(this)" style="background:#6c757d;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;min-width:30px;">📋</button>
                        </div>
                    </div>`
                ).join('');
            }

            const typeIcon = i.questionType === 5 ? '🔗' :
                (i.questionType === 4 ? '🎯' :
                    (i.questionType === 7 ? '✍️' :
                        (i.questionType === 3 ? '📋' : '📝')));
            return `<div style="margin-bottom:15px;padding:12px;background:#f8f9fa;border-radius:6px;">
                <div style="font-weight:bold;color:#007bff;margin-bottom:8px;font-size:15px;">
                    ${typeIcon} Câu ${i.order}: ${i.title.replace(/\[.*?\]\s*/, '')}
                </div>
                ${answersHtml}
            </div>`;
        }).join('');

        const ft = document.createElement('div');
        ft.style.cssText = 'padding:12px;border-top:1px solid #ddd;background:#f8f9fa;display:flex;gap:8px';

        const copyAllBtn = document.createElement('button');
        copyAllBtn.textContent = '📋 Copy All';
        copyAllBtn.style.cssText = 'flex:1;padding:10px;background:#28a745;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold';
        copyAllBtn.onclick = () => copyToClipboard(c, copyAllBtn);

        const autoFillBtn = document.createElement('button');
        autoFillBtn.textContent = '🤖 Auto-Fill';
        autoFillBtn.style.cssText = 'padding:10px 15px;background:#ffc107;color:black;border:none;border-radius:4px;cursor:pointer;font-weight:bold';
        autoFillBtn.onclick = () => autoFillAnswers(currentAnswers);

        const closeFooterBtn = document.createElement('button');
        closeFooterBtn.textContent = '❌ Close';
        closeFooterBtn.style.cssText = 'padding:10px 15px;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold';
        closeFooterBtn.onclick = () => {
            nixPopup = null;
            n.remove()
        };

        ft.appendChild(copyAllBtn);
        ft.appendChild(autoFillBtn);
        ft.appendChild(closeFooterBtn);
        content.appendChild(ct);
        content.appendChild(ft);

        let isMinimized = false;
        minimizeBtn.onclick = () => {
            isMinimized = !isMinimized;
            if (isMinimized) {
                content.style.height = '0px';
                content.style.opacity = '0';
                minimizeBtn.innerHTML = '➕'
            } else {
                content.style.height = 'auto';
                content.style.opacity = '1';
                minimizeBtn.innerHTML = '➖'
            }
        };

        closeBtn.onclick = () => {
            nixPopup = null;
            n.remove()
        };

        n.appendChild(h);
        n.appendChild(content);
        document.body.appendChild(n);
        makeDraggable(n)
    }

    function d(a) {
        if (a.length === 0) {
            console.log('⚠️ No answers found');
            return
        }

        console.log('📚 === JAPANESE ANSWERS ===');
        a.forEach(i => {
            console.log(`🔸 Q${i.order}: ${i.title}`);
            if (i.questionType === 5) {
                // Matching questions
                i.correctAnswers.forEach((match, idx) => console.log(`   🔗 ${idx + 1}: ${match.question} → ${match.answer}`));
            } else if (i.questionType === 4) {
                // Drag & drop questions
                i.correctAnswers.forEach((item, idx) => console.log(`   🎯 ${idx + 1}: ${item.content} (${item.coordinates.x}, ${item.coordinates.y})`));
            } else if (i.questionType === 7) {
                // Short answer questions
                i.correctAnswers.forEach((item, idx) => console.log(`   ✍️ ${item.order}: ${item.content} (${item.type})`));
            } else if (i.questionType === 3) {
                // Type 3 drag & drop
                i.correctAnswers.forEach((item, idx) => console.log(`   📋 ${item.order}: ${item.content} (index: ${item.correctIndex})`));
            } else {
                // Regular questions
                i.correctAnswers.forEach((ans, idx) => console.log(`   ✅ ${idx + 1}: ${ans}`));
            }
        });

        const c = a.map(i => {
            if (i.questionType === 5) {
                return i.correctAnswers.map(match => `${match.question} → ${match.answer}`).join('\n');
            } else if (i.questionType === 4) {
                return i.correctAnswers.map(item => item.content).join('\n');
            } else if (i.questionType === 7) {
                return i.correctAnswers.map(item => `${item.order}. ${item.content}`).join('\n');
            } else if (i.questionType === 3) {
                return i.correctAnswers.map(item => `${item.order}. ${item.content}`).join('\n');
            } else {
                return i.correctAnswers.join('\n');
            }
        }).join('\n');
        console.log('📋 === ALL ANSWERS ===');
        console.log(c);

        if (navigator.clipboard) navigator.clipboard.writeText(c).then(() => console.log('✅ Copied to clipboard!')).catch(err => console.log('⚠️ Copy failed:', err));

        s(a, c);

        // Auto-fill if enabled
        if (autoCompleteEnabled) {
            setTimeout(() => autoFillAnswers(a), 2000);
        }
    }

    window.XMLHttpRequest = function () {
        const x = new o();
        const op = x.open;
        x.open = function (m, u, ...args) {
            x._url = u;
            return op.apply(this, [m, u, ...args])
        };

        const orc = x.onreadystatechange;
        x.onreadystatechange = function () {
            if (x.readyState === 4 && x.status === 200 && x._url && x._url.includes('quiz-submission-check-answer')) {
                console.log('🎯 Detected quiz response');
                const a = e(x.responseText);
                if (a.length > 0) d(a)
            }
            if (orc) return orc.apply(this, arguments)
        };
        return x
    };

    window.fetch = function (u, opt) {
        return f.apply(this, arguments).then(r => {
            if (u.includes('quiz-submission-check-answer') && r.ok) {
                const cr = r.clone();
                cr.text().then(t => {
                    console.log('🎯 Detected quiz response (fetch)');
                    const a = e(t);
                    if (a.length > 0) d(a)
                })
            }
            return r
        })
    };

    window.nixExtract = function (rt) {
        const a = e(rt);
        d(a)
    };

    window.nixToggle = function () {
        if (nixPopup) {
            nixPopup.style.display = nixPopup.style.display === 'none' ? 'block' : 'none'
        }
    };

    window.nixAutoFill = function () {
        if (currentAnswers.length > 0) {
            autoFillAnswers(currentAnswers);
        } else {
            console.log('⚠️ No answers available for auto-fill');
        }
    };

    const extractBtn = document.createElement('button');
    extractBtn.innerHTML = '🎌 Extract Answers';
    extractBtn.style.cssText = 'position:fixed;top:20px;left:20px;z-index:9999;background:#007bff;color:white;border:none;padding:12px 16px;border-radius:6px;cursor:pointer;font-weight:bold;box-shadow:0 3px 15px rgba(0,0,0,0.3);font-size:14px';
    extractBtn.onclick = () => {
        const r = prompt('Paste JSON response from Network tab:');
        if (r) nixExtract(r)
    };
    document.body.appendChild(extractBtn);

    console.log('✅ NIX LMS Extractor Enhanced with Auto-Complete!\n🔹 Auto-intercepts quiz responses\n🔹 Auto-fill all question types (dropdown, drag&drop, radio, checkbox, text)\n🔹 Toggle auto-complete with 🤖 button\n🔹 Manual auto-fill with 🚀 button\n🔹 Drag popup by header (avoid buttons)\n🔹 Individual copy buttons for each answer\n🔹 Functions: nixExtract(json), nixAutoFill(), nixToggle()')
})();