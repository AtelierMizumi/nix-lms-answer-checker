---
description: How to add support for a new question type
---

# Add New Question Type Workflow

## Overview

The script uses Strategy Pattern to handle different question types. Each type
has:

1. **Parser handler** - Extracts answer data from JSON
2. **Solver handler** - Fills answers in the DOM
3. **UI renderer** - Displays answer in popup

## Steps

### 1. Identify the Question Type

- Open DevTools Network tab
- Submit a quiz with the new question type
- Find the `quiz-submission-check-answer` response
- Analyze the JSON structure

### 2. Add Parser Logic

In `Parser.processQuestion()`, add a new condition:

```javascript
// STRATEGY: TYPE X (Description)
else if (q.type === X) {
    // Extract answer data
    q.answers.forEach(ans => {
        result.answers.push({
            content: this.cleanHtml(ans.content),
            // Add type-specific fields
            type: 'new-type'
        });
    });
}
```

### 3. Add Solver Handler

In `Solver`, add a new method:

```javascript
async handleTypeX(container, questionData) {
    Utils.log('🎯 Type X - Description');

    for (const answer of questionData.answers) {
        // Find and fill the element
        // Trigger necessary events
    }
}
```

Update `fillQuestion()` to call the new handler:

```javascript
else if (questionData.type === X) {
    await this.handleTypeX(container, questionData);
}
```

### 4. Add UI Renderer

In `UI.renderAnswerItem()`, add rendering for new type:

```javascript
if (type === X) {
    return `<div style="...">
        ${ans.content}
    </div>`;
}
```

### 5. Update Config

Add selectors for new type in `CONFIG.SELECTORS`:

```javascript
TYPE_X_SELECTOR: '.type-x-element',
```

### 6. Add Test Fixture

Create `tests/fixtures/type-X-description.json` with sample response.

### 7. Update Documentation

Add new type to README.md in "Supported Question Types" section.

## Example: Type 3 (Drag & Drop)

See implementation in:

- Parser: lines 138-154
- Solver: `handleType3()` method
- UI: `renderAnswerItem()` type 3 case
