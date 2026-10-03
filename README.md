<p align="center">
  <img src="https://img.shields.io/badge/version-2.3.1-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/platform-Browser-orange?style=for-the-badge" alt="Platform">
  <img src="https://visitor-badge.laobi.icu/badge?page_id=AtelierMizumi.nix-lms-answer-checker" alt="Visitors">
  <a href="https://nix-helper-analytics.thuanc177.workers.dev/dashboard" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/endpoint?url=https%3A%2F%2Fnix-helper-analytics.thuanc177.workers.dev%2Fbadge" alt="Use count">
  </a>
</p>

<h1 align="center">NIX LMS Answer Helper</h1>

<p align="center">
  Hiển thị response đáp án từ NIX Digital LMS và hỗ trợ điền đáp án vào quiz.
</p>

## Cài đặt nhanh

### Cách 1: Bookmarklet (Khuyên dùng - Không cần Extension, Không cần Dev Mode)

Cách nhanh nhất, hoạt động trên mọi trình duyệt (Chrome, Edge, Zen Browser,
Firefox, Safari) mà **không cần cài extension**, **không cần bật Developer
Mode**, và hoàn toàn không bị ảnh hưởng bởi Manifest V3:

1. Mở thanh dấu trang trình duyệt (`Ctrl+Shift+B` hoặc `Cmd+Shift+B`).
2. Tạo một Bookmark mới (hoặc kéo thả một bookmark bất kỳ vào thanh dấu trang
   rồi chọn **Edit / Chỉnh sửa**).
3. Đặt tên: `NIX Helper`.
4. Trong ô **URL**, dán đoạn mã sau:

```javascript
javascript: (async () => {
    if (window.__NIX_LMS_HELPER_INITIALIZED__) {
        if (
            !document.getElementById('nix-helper-root') &&
            typeof window.__NIX_LMS_HELPER_REOPEN__ === 'function'
        ) {
            window.__NIX_LMS_HELPER_REOPEN__();
        }
        return;
    }
    try {
        const r = await fetch(
            'https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js'
        );
        const t = await r.text();
        const s = document.createElement('script');
        s.textContent = t;
        document.documentElement.appendChild(s);
        s.remove();
    } catch (e) {
        console.error('NIX Helper failed to load:', e);
    }
})();
```

5. Khi làm quiz trên `https://digital.nix.edu.vn`, chỉ cần **bấm vào bookmark
   "NIX Helper"** một lần, giao diện sẽ xuất hiện ngay lập tức và tự động cập
   nhật bản mới nhất từ GitHub.

### Cách 2: Tampermonkey Userscript

Script sẽ tự động nạp mỗi khi mở `https://digital.nix.edu.vn` và có thể tự cập
nhật từ GitHub. Đã hỗ trợ `@grant none` cùng cơ chế tự động inject Main World,
tương thích với cả Manifest V2 và Manifest V3 (kể cả khi Firefox chuyển sang
MV3).

1. Cài [Tampermonkey](https://www.tampermonkey.net/).
2. **Lưu ý trên trình duyệt Chromium (Chrome / Edge):**
    - **Chrome 138+**: Vào `chrome://extensions` > Tìm Tampermonkey > bấm
      **Details (Chi tiết)** > Bật công tắc **"Allow User Scripts" (Cho phép tập
      lệnh người dùng)**. Không cần bật Developer Mode toàn trình duyệt.
    - **Bản Chrome cũ hơn**: Bật **"Developer mode" (Chế độ cho nhà phát
      triển)** ở góc trên bên phải của `chrome://extensions`.
    - **Firefox / Zen Browser**: Không cần thao tác gì thêm.
3. Mở trình quản lý Tampermonkey bằng cách bấm biểu tượng extension, sau đó chọn
   **Dashboard**.
4. Mở tab **Utilities**.
5. Tại mục **Install from URL**, dán URL sau:

`https://raw.githubusercontent.com/AtelierMizumi/nix-lms-answer-checker/main/dist/nix-helper.user.js`

6. Bấm **Install** trong màn hình xác nhận của Tampermonkey.
7. Quay lại `https://digital.nix.edu.vn` và tải lại trang quiz.

Domain hiện được hỗ trợ:

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

Popup hiển thị bộ đếm tổng lượt sử dụng thực tế của cộng đồng NIX Helper. Số đếm
được đồng bộ trực tiếp từ Cloudflare Edge Telemetry API (bắt đầu từ mốc `403` để
kế thừa lịch sử). Mỗi khi một phiên điền đáp án thực sự bắt đầu, dù được kích
hoạt tự động hay bằng nút **Điền đáp án ngay**, bộ đếm sẽ được tăng và ghi nhận
thống kê ẩn danh. Nếu mất mạng hoặc server không phản hồi, script sẽ tự động
chuyển sang bộ đếm cục bộ mà không bao giờ làm gián đoạn việc điền bài.

Telemetry tuân thủ nghiêm ngặt quyền riêng tư:

- Không lưu địa chỉ IP thật (được băm bằng SHA-256 kèm salt bảo mật).
- Không gửi câu hỏi, đáp án hay bất kỳ thông tin sinh viên nào ra ngoài.
- Chi tiết hạ tầng Cloudflare Worker và D1 Database xem tại
  [worker/README.md](worker/README.md).

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

Script xử lý response và giao diện trong trình duyệt. Runtime không gửi nội dung
quiz, đáp án, URL câu hỏi hoặc thông tin tài khoản ra ngoài. Mỗi khi một phiên
autofill thực sự bắt đầu, script gửi một request counter không chứa dữ liệu quiz
đến [Cloudflare Worker & D1 Database](https://nix-helper-analytics.thuanc177.workers.dev/dashboard) để đồng bộ badge **Use count** trong README và giao diện người dùng. Địa chỉ IP được băm (hash SHA-256) cùng secret salt, hoàn toàn không lưu trữ IP thô hay dữ liệu cá nhân. Nếu dịch vụ này
không hoạt động hoặc mất kết nối, autofill vẫn tiếp tục bình thường.

README cũng tải visitor badge từ `visitor-badge.laobi.icu`; đây là dịch vụ bên
ngoài của tài liệu, không phải luồng xử lý dữ liệu quiz.

## Cấu trúc dự án

```text
nix-lms-answer-checker/
├── paste-to-console.js       # Runtime canonical cho console và build
├── dist/nix-helper.user.js    # Userscript Tampermonkey được build
├── dist/nix-helper.bookmarklet.js # Bookmarklet loader
├── src/parser.js              # Parser được test
├── tests/                     # Vitest và fixture
├── scripts/build-userscript.mjs
├── worker/                    # Cloudflare Worker & D1 Analytics Dashboard backend
├── package.json
└── README.md
```

## Giấy phép

MIT. Xem [LICENSE](LICENSE).

> Công cụ dành cho mục đích học tập. Hãy sử dụng có trách nhiệm và tuân thủ quy
> định của tổ chức giáo dục.
