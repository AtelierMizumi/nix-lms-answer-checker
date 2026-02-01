---
description: How to test the script with sample data
---

# Test Workflow

## Manual Testing

### 1. Test with Tampermonkey
1. Install Tampermonkey extension
2. Create new userscript
3. Copy content from `src/nix-helper.user.js`
4. Visit NIX LMS website
5. Start a quiz - script should auto-capture answers

### 2. Test with Console
1. Open NIX LMS quiz page
2. Press F12 to open DevTools
3. Copy content from `paste-to-console.js`
4. Paste into Console and press Enter
5. Start quiz - answers should appear in popup

## Testing with Fixtures

Use the sample JSON files in `tests/fixtures/` to test parsing:

// turbo
```bash
# In browser console after loading script:
# 1. Click "🐞 Debug Mode: Paste JSON" button
# 2. Paste content from fixture file
# 3. Verify answers display correctly
```

## Fixture Files
- `type-3-drag-order.json` - Drag & drop with ordering
- `type-4-drag-position.json` - Drag & drop with coordinates
- `type-5-matching.json` - Matching questions
- `type-7-fill-blank.json` - Fill in the blank
- `standard-multiple-choice.json` - Multiple choice

## Validation Checklist
- [ ] UI popup appears after script loads
- [ ] Network interceptor captures quiz responses
- [ ] Parser extracts answers correctly for each type
- [ ] Auto-fill works for supported question types
- [ ] Copy button copies formatted text
