<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/platform-Browser-orange?style=for-the-badge" alt="Platform">
  <a href="https://hits.seeyoufarm.com"><img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2FAtelierMizumi%2Fnix-lms-answer-checker&count_bg=%2379C83D&title_bg=%23555555&icon=github.svg&icon_color=%23E7E7E7&title=Views&edge_flat=false" alt="Views"></a>
</p>

<h1 align="center">🤖 NIX LMS Answer Helper</h1>

<p align="center">
  <strong>Tự động trích xuất và hiển thị đáp án từ NIX Digital LMS</strong><br>
  <em>Hỗ trợ auto-fill thông minh cho nhiều loại câu hỏi</em>
</p>

<p align="center">
  <a href="#-cài-đặt-nhanh">Cài đặt</a> •
  <a href="#-tính-năng">Tính năng</a> •
  <a href="#-hướng-dẫn-sử-dụng">Hướng dẫn</a> •
  <a href="#-english">English</a>
</p>

---

## 🚀 Cài đặt nhanh

### Cách 1: Tampermonkey (Khuyến nghị) ⭐

> Script tự động chạy mỗi khi bạn truy cập NIX LMS!

| Bước | Hành động                                                                     |
| :--: | ----------------------------------------------------------------------------- |
|  1️⃣  | Cài đặt [Tampermonkey](https://www.tampermonkey.net/) cho trình duyệt của bạn |
|  2️⃣  | Click icon Tampermonkey → **"Create a new script"**                           |
|  3️⃣  | Xóa hết nội dung mặc định                                                     |
|  4️⃣  | Copy nội dung từ [`src/nix-helper.user.js`](src/nix-helper.user.js)           |
|  5️⃣  | Paste vào Tampermonkey và **Save** (Ctrl+S)                                   |
|  6️⃣  | Truy cập NIX LMS - Script tự động hoạt động! ✨                               |

### Cách 2: Console (Nhanh gọn)

```
1. Mở DevTools (F12) → Tab Console
2. Copy nội dung từ paste-to-console.js
3. Paste vào Console → Enter
4. Làm bài quiz - đáp án hiện tự động!
```

---

## ✨ Tính năng

<table>
<tr>
<td width="50%">

### 📡 Tự động bắt đáp án

- Chặn API response tự động
- Không cần thao tác thủ công
- Hỗ trợ XMLHttpRequest & Fetch

</td>
<td width="50%">

### 🎯 Auto-Fill thông minh

- Điền form tự động
- Hỗ trợ drag & drop
- Mô phỏng sự kiện chính xác

</td>
</tr>
<tr>
<td>

### 🎨 Giao diện đẹp

- Popup kéo thả được
- Thiết kế hiện đại
- Phân loại theo màu sắc

</td>
<td>

### 📋 Tiện ích

- Copy đáp án 1 click
- Thu nhỏ/phóng to popup
- Debug mode cho developer

</td>
</tr>
</table>

---

## 📚 Loại câu hỏi hỗ trợ

| Type | Loại câu hỏi             | Hiển thị | Auto-Fill |
| :--: | ------------------------ | :------: | :-------: |
| 🎯 3 | Kéo thả theo thứ tự      |    ✅    |    ✅     |
| 📐 4 | Kéo thả theo tọa độ      |    ✅    |    ✅     |
| 🔗 5 | Ghép nối (Matching)      |    ✅    |    ✅     |
| ✍️ 7 | Điền vào chỗ trống       |    ✅    |    ✅     |
| 📝 1 | Trắc nghiệm đơn          |    ✅    |    ✅     |
| ☑️ 2 | Trắc nghiệm nhiều đáp án |    ✅    |    ✅     |

---

## 📖 Hướng dẫn sử dụng

### Bước 1: Cài đặt script

Làm theo hướng dẫn ở phần [Cài đặt nhanh](#-cài-đặt-nhanh)

### Bước 2: Truy cập quiz

Vào trang quiz trên NIX LMS. Popup sẽ xuất hiện ở góc phải màn hình:

```
┌─────────────────────────────────────┐
│ 🤖 NIX Helper (Tampermonkey)    _ × │
├─────────────────────────────────────┤
│                                     │
│         📡 Waiting for quiz...      │
│                                     │
├─────────────────────────────────────┤
│  🚀 Auto-Fill  │  📋 Copy All       │
└─────────────────────────────────────┘
```

### Bước 3: Làm bài quiz

Bắt đầu làm quiz bình thường. Khi bạn submit hoặc check đáp án:

- Script tự động bắt response từ server
- Đáp án hiển thị trong popup
- Mỗi loại câu hỏi có màu riêng

### Bước 4: Sử dụng đáp án

| Nút              | Chức năng                           |
| ---------------- | ----------------------------------- |
| 🚀 **Auto-Fill** | Tự động điền tất cả đáp án vào form |
| 📋 **Copy All**  | Copy đáp án ra clipboard            |
| **\_**           | Thu nhỏ popup                       |
| **×**            | Đóng popup                          |

---

## 🎨 Giao diện hiển thị đáp án

Mỗi loại câu hỏi được hiển thị với màu sắc và icon riêng:

```
┌─ 🎯 Q1: Sắp xếp theo thứ tự ────────────────┐
│  Type 3 • 4 answer(s)                       │
│  ┌────────────────────────────────────────┐ │
│  │ 📍 Drag "Bước 1" → Position #1         │ │
│  │ 📍 Drag "Bước 2" → Position #2         │ │
│  │ 📍 Drag "Bước 3" → Position #3         │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─ 🔗 Q2: Ghép nối thuật ngữ ─────────────────┐
│  Type 5 • 3 answer(s)                       │
│  ┌────────────────────────────────────────┐ │
│  │ 🔗 HTML → Ngôn ngữ đánh dấu            │ │
│  │ 🔗 CSS → Định dạng giao diện           │ │
│  │ 🔗 JS → Lập trình client               │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## ⚙️ Cấu hình

Chỉnh sửa phần `CONFIG` trong script:

```javascript
const CONFIG = {
    DEBUG: false, // Bật console log chi tiết
    AUTO_FILL_DELAY: 500 // Độ trễ giữa mỗi câu (ms)
};
```

---

## 🛠️ Khắc phục sự cố

<details>
<summary><b>❓ Script không chạy trên Tampermonkey</b></summary>

1. Kiểm tra Tampermonkey đã enabled
2. Kiểm tra URL match pattern trong script header
3. Thử refresh trang (F5)
4. Kiểm tra Console (F12) có lỗi không

</details>

<details>
<summary><b>❓ Đáp án không hiện</b></summary>

1. Đảm bảo đang ở trang quiz với câu hỏi
2. Thử submit/check answer để trigger API
3. Kiểm tra Network tab có request `quiz-submission-check-answer`
4. Bật DEBUG mode để xem log chi tiết

</details>

<details>
<summary><b>❓ Auto-Fill không hoạt động</b></summary>

1. Đợi trang load hoàn toàn
2. Kiểm tra Console có lỗi JavaScript
3. Một số loại câu hỏi cần jQuery UI
4. Thử fill thủ công theo thông tin hiển thị

</details>

---

## 🔒 Bảo mật & Quyền riêng tư

| Đặc điểm                 | Mô tả                                  |
| ------------------------ | -------------------------------------- |
| 🏠 **Xử lý cục bộ**      | Mọi thứ chạy trong trình duyệt của bạn |
| 🚫 **Không gửi dữ liệu** | Script không kết nối server bên ngoài  |
| 🔐 **Không lưu trữ**     | Đáp án chỉ tồn tại trong session       |

---

## 📁 Cấu trúc dự án

```
nix-lms-answer-checker/
├── 📄 paste-to-console.js    # Phiên bản paste vào Console
├── 📁 src/
│   └── 🔧 nix-helper.user.js # Phiên bản Tampermonkey
├── 📁 tests/fixtures/         # Sample JSON để test
├── 📁 .agent/workflows/       # Hướng dẫn cho developer
├── 📄 package.json
├── 📄 README.md
└── 📄 LICENSE
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Xem [workflows](.agent/workflows/) để biết
cách:

- Thêm loại câu hỏi mới
- Debug và test
- Build project

---

## 📄 License

MIT License - Xem [LICENSE](LICENSE)

> ⚠️ **Lưu ý**: Công cụ này chỉ dành cho mục đích học tập. Hãy sử dụng có trách
> nhiệm và tuân thủ quy định của tổ chức giáo dục.

---

<h2 id="-english">🇬🇧 English</h2>

<details>
<summary><b>Click to expand English documentation</b></summary>

### Quick Start

**Tampermonkey (Recommended):**

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Create new script → paste content from `src/nix-helper.user.js`
3. Save and visit NIX LMS

**Console:**

1. Open DevTools (F12)
2. Paste `paste-to-console.js` content
3. Start quiz

### Features

- 📡 Auto-capture quiz answers from API
- 🎯 Smart auto-fill for all question types
- 🎨 Beautiful draggable popup UI
- 📋 One-click copy answers

### Supported Question Types

- Type 3: Drag & drop ordering
- Type 4: Drag & drop positioning
- Type 5: Matching questions
- Type 7: Fill in the blank
- Standard: Multiple choice, checkboxes

### Troubleshooting

- Enable DEBUG mode for detailed logs
- Check Console (F12) for errors
- Ensure you're on a quiz page

</details>

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/AtelierMizumi">AtelierMizumi</a>
</p>
