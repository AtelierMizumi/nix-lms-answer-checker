---
description: How to debug the script with sample data
---

# Debug Workflow

## Enable Debug Mode

In the script, set:

```javascript
CONFIG.DEBUG = true;
```

This enables:

- Console logging with 🥷 prefix
- Debug button in UI for manual JSON input

## Debug with Browser DevTools

### 1. Monitor Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "quiz-submission"
4. Click on request to see response

### 2. Check Console Logs

Look for messages with these prefixes:

- `🥷 [NIX-Helper]:` - Info logs (DEBUG mode)
- `❌ [NIX-Helper Error]:` - Error logs
- `✅` - Success confirmations
- `⚠️` - Warnings

### 3. Test Parser Manually

// turbo

```javascript
// In console after loading script:
const testJson = '{"questions": [...]}';
const answers = Parser.parse(testJson);
console.log(answers);
```

## Use Debug Mode Button

1. Load script with `CONFIG.DEBUG = true`
2. Click "🐞 Debug Mode: Paste JSON" button
3. Paste JSON from Network tab
4. Answers will be extracted and displayed

## Common Issues

### Answers Not Captured

- Check if endpoint matches `quiz-submission-check-answer`
- Verify network hooks are installed (check console)

### Auto-Fill Not Working

- Check if question container is found
- Verify selectors match the DOM structure
- Check for JavaScript errors in console

### Drag & Drop Issues

- jQuery UI must be loaded on page
- Check if `.ui-draggable` class exists
- Verify drop zones have `.ui-droppable` class
