# 📚 Hướng Dẫn Đóng Góp & Phát Triển

Tài liệu này hướng dẫn cách thiết lập môi trường, chạy tests, và đóng góp cho dự
án NIX LMS Answer Helper.

## 📋 Mục Lục

- [Yêu Cầu Hệ Thống](#-yêu-cầu-hệ-thống)
- [Cài Đặt Môi Trường](#-cài-đặt-môi-trường)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Chạy Tests](#-chạy-tests)
- [Quy Trình Phát Triển](#-quy-trình-phát-triển)
- [Thêm Loại Câu Hỏi Mới](#-thêm-loại-câu-hỏi-mới)
- [Quy Ước Code](#-quy-ước-code)
- [Tạo Pull Request](#-tạo-pull-request)

---

## 💻 Yêu Cầu Hệ Thống

| Công cụ | Phiên bản | Mục đích        |
| ------- | --------- | --------------- |
| Node.js | 18+       | Runtime         |
| npm     | 9+        | Package manager |
| Git     | 2.0+      | Version control |

---

## 🔧 Cài Đặt Môi Trường

### 1. Clone repository

```bash
git clone https://github.com/AtelierMizumi/nix-lms-answer-checker.git
cd nix-lms-answer-checker
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Kiểm tra cài đặt

```bash
npm test
```

Kết quả mong đợi:

```
✓ tests/parser.test.js (32 tests)
Test Files  1 passed (1)
Tests       32 passed (32)
```

---

## 📁 Cấu Trúc Dự Án

```
nix-lms-answer-checker/
├── 📄 paste-to-console.js       # Script paste vào Console
├── 📁 src/
│   ├── 🔧 nix-helper.user.js    # Tampermonkey userscript
│   └── 🧩 parser.js             # Parser module (cho testing)
├── 📁 tests/
│   ├── 🧪 parser.test.js        # Unit tests
│   └── 📁 fixtures/             # Test data
│       ├── responses.js         # JS test fixtures
│       ├── type-3-drag-order.json
│       ├── type-4-drag-position.json
│       ├── type-5-matching.json
│       ├── type-7-fill-blank.json
│       └── standard-multiple-choice.json
├── 📁 .agent/workflows/         # Workflow guides
├── 📄 eslint.config.js          # ESLint configuration
├── 📄 vitest.config.js          # Vitest configuration
├── 📄 .prettierrc               # Prettier configuration
└── 📄 package.json
```

---

## 🧪 Chạy Tests

### Scripts có sẵn

| Lệnh                    | Mô tả                          |
| ----------------------- | ------------------------------ |
| `npm test`              | Chạy tất cả tests              |
| `npm run test:watch`    | Chạy tests ở chế độ watch      |
| `npm run test:coverage` | Chạy tests với coverage report |
| `npm run lint`          | Kiểm tra code với ESLint       |
| `npm run lint:fix`      | Tự động sửa lỗi ESLint         |
| `npm run format`        | Format code với Prettier       |
| `npm run format:check`  | Kiểm tra format                |

### Chạy tests cơ bản

```bash
npm test
```

### Chạy với coverage

```bash
npm run test:coverage
```

Output mẫu:

```
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
parser.js          |   92.85 |    78.57 |    90.9 |   94.38 |
-------------------|---------|----------|---------|---------|
```

### Test thủ công với Debug Mode

1. Bật DEBUG mode trong script:

```javascript
const CONFIG = {
    DEBUG: true // Bật mode debug
    // ...
};
```

2. Load script vào browser
3. Click nút **"🐞 Debug Mode: Paste JSON"**
4. Paste nội dung từ file trong `tests/fixtures/`
5. Kiểm tra kết quả hiển thị

---

## 🔄 Quy Trình Phát Triển

### 1. Tạo branch mới

```bash
git checkout main
git pull origin main
git checkout -b feature/ten-tinh-nang
```

### 2. Phát triển tính năng

```bash
# Code...
npm test        # Chạy tests
npm run lint    # Kiểm tra code quality
npm run format  # Format code
```

### 3. Commit changes

```bash
git add .
git commit -m "feat: mô tả ngắn gọn"
```

#### Quy ước commit message

| Prefix      | Mục đích                           |
| ----------- | ---------------------------------- |
| `feat:`     | Tính năng mới                      |
| `fix:`      | Sửa bug                            |
| `test:`     | Thêm/sửa tests                     |
| `docs:`     | Cập nhật documentation             |
| `style:`    | Format code (không thay đổi logic) |
| `refactor:` | Refactor code                      |
| `chore:`    | Maintenance tasks                  |

### 4. Push và tạo PR

```bash
git push -u origin feature/ten-tinh-nang
gh pr create --title "feat: Mô tả" --body "Chi tiết..."
```

---

## ➕ Thêm Loại Câu Hỏi Mới

### Bước 1: Phân tích API Response

1. Mở DevTools → Network tab
2. Submit quiz với loại câu hỏi mới
3. Tìm request `quiz-submission-check-answer`
4. Phân tích cấu trúc JSON response

### Bước 2: Thêm Parser Logic

Trong `Parser.processQuestion()`:

```javascript
// STRATEGY: TYPE X (Description)
else if (q.type === X) {
    q.answers.forEach(ans => {
        result.answers.push({
            content: this.cleanHtml(ans.content),
            // Thêm fields đặc trưng cho type
            type: 'new-type'
        });
    });
}
```

### Bước 3: Thêm Solver Handler

Trong `Solver`:

```javascript
async handleTypeX(container, questionData) {
    Utils.log('🎯 Type X - Description');

    for (const answer of questionData.answers) {
        // Tìm element và fill
        // Trigger events cần thiết
    }
}
```

Cập nhật `fillQuestion()`:

```javascript
else if (questionData.type === X) {
    await this.handleTypeX(container, questionData);
}
```

### Bước 4: Thêm UI Renderer

Trong `UI.renderAnswerItem()`:

```javascript
if (type === X) {
    return `<div style="background:#...; padding: 6px 8px; ...">
        🆕 <strong>${ans.content}</strong>
    </div>`;
}
```

### Bước 5: Thêm Tests

1. Tạo test fixture trong `tests/fixtures/responses.js`:

```javascript
export const typeXResponse = {
    question: {
        id: 12345,
        type: X
        // ...
    },
    expectedAnswers: [
        /* ... */
    ]
};
```

2. Thêm test case trong `tests/parser.test.js`:

```javascript
describe('processQuestion - Type X', () => {
    it('should extract answers correctly', () => {
        const { question, expectedAnswers } = typeXResponse;
        const result = Parser.processQuestion(question);

        expect(result.type).toBe(X);
        // assertions...
    });
});
```

### Bước 6: Cập nhật Documentation

- README.md: Thêm vào bảng "Loại câu hỏi hỗ trợ"
- Tạo fixture JSON file nếu cần

---

## 📐 Quy Ước Code

### ESLint Rules

- `no-unused-vars`: Warn (pattern `^_` cho tham số không dùng)
- `no-console`: Off (cần cho debug)
- `prefer-const`: Warn
- `semi`: Always required

### Prettier Config

```json
{
    "semi": true,
    "singleQuote": true,
    "tabWidth": 4,
    "printWidth": 100,
    "trailingComma": "none",
    "arrowParens": "avoid"
}
```

### Naming Conventions

| Loại            | Convention       | Ví dụ               |
| --------------- | ---------------- | ------------------- |
| Variables       | camelCase        | `questionData`      |
| Constants       | UPPER_SNAKE_CASE | `CONFIG`, `STATE`   |
| Functions       | camelCase        | `processQuestion()` |
| Classes/Modules | PascalCase       | `Parser`, `Solver`  |
| Files           | kebab-case       | `parser.test.js`    |

---

## 🚀 Tạo Pull Request

### Checklist trước khi tạo PR

- [ ] Tests pass: `npm test`
- [ ] Lint pass: `npm run lint`
- [ ] Format đúng: `npm run format:check`
- [ ] Commit messages theo quy ước
- [ ] Đã cập nhật documentation nếu cần

### Template PR

```markdown
## Summary

- Mô tả ngắn gọn thay đổi

## Changes

- Chi tiết từng thay đổi

## Testing

- Cách đã test
- Test results

## Screenshots (nếu có UI changes)
```

### Sau khi tạo PR

1. Đợi CI checks pass
2. Request review nếu cần
3. Address feedback
4. Merge khi approved

---

## 🆘 Troubleshooting

### Tests fail với "document is not defined"

Đảm bảo `vitest.config.js` có:

```javascript
test: {
    environment: 'jsdom';
}
```

### ESLint báo lỗi globals

Thêm globals vào `eslint.config.js`:

```javascript
globals: {
    GM_setClipboard: 'readonly',
    // ...
}
```

### Coverage thấp

Kiểm tra uncovered lines và thêm tests cho edge cases.

---

## 📞 Liên Hệ

- **Issues**:
  [GitHub Issues](https://github.com/AtelierMizumi/nix-lms-answer-checker/issues)
- **Discussions**:
  [GitHub Discussions](https://github.com/AtelierMizumi/nix-lms-answer-checker/discussions)

---

<p align="center">
  <em>Cảm ơn bạn đã đóng góp! 🙏</em>
</p>
