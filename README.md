<p align="center">
  <img src="https://img.shields.io/badge/version-2.2.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/platform-Browser-orange?style=for-the-badge" alt="Platform">
  <img src="https://visitor-badge.laobi.icu/badge?page_id=AtelierMizumi.nix-lms-answer-checker" alt="Visitors">
</p>

<h1 align="center">NIX LMS Answer Helper</h1>

<p align="center">
  Hiển thị response đáp án từ NIX Digital LMS và hỗ trợ điền đáp án vào quiz.
</p>

## Cài đặt nhanh

### Tampermonkey, khuyến nghị

Tampermonkey là cách cài chính. Script sẽ tự nạp khi mở
`https://digital.nix.edu.vn` và có thể tự cập nhật từ GitHub.

1. Cài [Tampermonkey](https://www.tampermonkey.net/).
2. Mở trình quản lý Tampermonkey bằng cách bấm biểu tượng extension, sau đó chọn
   **Dashboard**.
3. Mở tab **Utilities**.
4. Tại mục **Install from URL**, dán URL sau:

`https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js`

5. Bấm **Install** trong màn hình xác nhận của Tampermonkey.
6. Quay lại `https://digital.nix.edu.vn` và tải lại trang quiz.

Domain hiện được hỗ trợ bởi userscript:

- `https://digital.nix.edu.vn/*`

### Console paste, dùng khi cần chạy thủ công

1. Mở đúng trang quiz trước khi có request cần theo dõi.
2. Mở DevTools bằng `F12` hoặc `Ctrl+Shift+I`, sau đó chọn **Console**.
3. Sao chép toàn bộ nội dung [paste-to-console.js](paste-to-console.js).
4. Paste vào Console và nhấn Enter.
5. Thực hiện lại thao tác check hoặc submit để tạo request.

Script chỉ xử lý response từ endpoint có chuỗi `quiz-submission-check-answer`.
Nếu request đã hoàn tất trước khi script được nạp, hãy thực hiện lại thao tác
đó.

## Cách sử dụng

Khi bắt được response, popup sẽ hiển thị các câu hỏi và đáp án. Các thao tác
chính:

- **Điền đáp án ngay**: chạy thủ công bộ đáp án đang hiển thị.
- **Tự động điền đáp án**: bật toggle để tự điền một lần khi nhận được kết quả
  Check Answer mới; response giống lần trước sẽ không chạy lại.
- Nút thu nhỏ và đóng popup: điều khiển giao diện hiển thị.

Trạng thái toggle được lưu trong trình duyệt bằng `localStorage`, nên lựa chọn
của bạn vẫn được giữ sau khi tải lại trang. Khi tắt, script chỉ hiển thị đáp án
và không tự thay đổi form quiz.

Popup cũng hiển thị bộ đếm lượt sử dụng. Bộ đếm bắt đầu từ `403` và được tăng
mỗi khi một phiên điền đáp án thực sự bắt đầu, dù được kích hoạt tự động hay
bằng nút **Điền đáp án ngay**. Đây là bộ đếm cục bộ trên thiết bị của bạn, không
phải số liệu global trên GitHub và không gửi dữ liệu quiz ra ngoài.

Các loại câu hỏi hiện có logic xử lý gồm Type 3 drag-order, Type 4
drag-position, Type 5 matching, Type 7 fill-blank và các câu hỏi lựa chọn thông
thường.

Auto-fill phụ thuộc vào selector, event handler và kích thước DOM thực tế của
NIX LMS. Thanh tiến trình trong popup hiển thị câu hiện đang xử lý và tổng số
câu. Hãy kiểm tra kết quả trên trang trước khi submit.

## Khắc phục sự cố

### Tampermonkey không chạy

- Kiểm tra extension và userscript đang được bật.
- Kiểm tra trang hiện tại là `https://digital.nix.edu.vn`.
- Tải lại trang sau khi cài hoặc cập nhật script.
- Mở Console để kiểm tra lỗi JavaScript.

### Không thấy đáp án

- Đảm bảo script đã được nạp trước thao tác check/submit.
- Thực hiện lại thao tác để tạo request mới.
- Trong Network, kiểm tra request có chứa `quiz-submission-check-answer`.
- Khi dùng console paste, kiểm tra Console để xem log bắt response.

### Auto-fill không hoạt động

- Đợi trang quiz tải hoàn toàn.
- Kiểm tra Console có lỗi selector hoặc event không.
- Một số thao tác kéo thả cần jQuery UI hoặc cấu trúc DOM tương ứng.
- Dùng **Điền đáp án ngay** để chạy lại thủ công sau khi trang đã sẵn sàng.

## Phát triển

Node.js 18 trở lên được dùng cho test và build.

```bash
npm install
npm test
npm run lint
npm run format:check
npm run build
```

`npm run build` tạo `dist/nix-helper.user.js`, là artifact userscript được
Tampermonkey cài và cập nhật. `paste-to-console.js` là runtime nguồn có thể copy
trực tiếp vào DevTools.

## Quyền riêng tư

Script xử lý response và giao diện trong trình duyệt. Runtime không chủ động gửi
dữ liệu quiz đến server riêng. README tải visitor badge từ
`visitor-badge.laobi.icu`; badge này là dịch vụ bên ngoài của tài liệu, không
phải luồng xử lý dữ liệu của script.

## Cấu trúc dự án

```text
nix-lms-answer-checker/
├── paste-to-console.js       # Runtime canonical cho console và build
├── dist/nix-helper.user.js    # Userscript Tampermonkey được build
├── src/parser.js              # Parser được test
├── tests/                     # Vitest và fixture
├── scripts/build-userscript.mjs
├── package.json
└── README.md
```

## Giấy phép

MIT. Xem [LICENSE](LICENSE).

> Công cụ dành cho mục đích học tập. Hãy sử dụng có trách nhiệm và tuân thủ quy
> định của tổ chức giáo dục.
