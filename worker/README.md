# ⚡ NIX Helper Telemetry & Analytics Worker

Hạ tầng Telemetry & Bộ đếm lượt sử dụng thời gian thực (Real-time Global Usage
Counter) cho NIX Digital LMS Helper, chạy trên **Cloudflare Workers** &
**Cloudflare D1 Database**.

---

## 🌟 Tính Năng Nổi Bật

1. **Đếm Tổng Thực Tế Toàn Cầu (Synchronized Global Counter)**:
    - Đồng bộ tức thì tổng số lượt giải quiz giữa tất cả người dùng script.
    - Bắt đầu từ mốc 403 để giữ tính liền mạch lịch sử.
2. **Bảo Mật & Chống Lạm Dụng (Anti-Abuse & Anti-Spam)**:
    - **Rate Limiting**: Giới hạn tần suất gọi API theo IP hash (tối đa 1
      lần/10s).
    - **Schema & Replay Defense**: Kiểm tra chữ ký timestamp và độ dài giá trị
      hợp lệ.
    - **CORS Strict Headers**: Kiểm soát domain gốc từ LMS `digital.nix.edu.vn`.
3. **Tuyệt Đối Riêng Tư (Privacy-First)**:
    - **Không lưu IP thật**: IP được băm (hash SHA-256) kèm secret salt.
    - **Không gửi dữ liệu nhạy cảm**: Tuyệt đối không gửi câu hỏi, đáp án hay
      thông tin sinh viên LMS.
4. **Dashboard Trực Quan (Live Edge Dashboard)**:
    - Truy cập ngay tại `/dashboard` trên trình duyệt để xem biểu đồ, số câu hỏi
      đã giải, active users theo ngày/tuần và phiên bản script.
5. **100% Miễn Phí & Vĩnh Viễn**:
    - Gói miễn phí Cloudflare D1 cho phép 5.000.000 lượt đọc và 100.000 lượt ghi
      mỗi ngày.

---

## 🚀 Hướng Dẫn Triển Khai (Chỉ mất 2 phút)

### Cách 1: Triển khai bằng Wrangler CLI (Khuyên dùng)

1. Cài đặt Wrangler và đăng nhập Cloudflare:

    ```bash
    npx wrangler login
    ```

2. Tạo cơ sở dữ liệu Cloudflare D1 miễn phí:

    ```bash
    npx wrangler d1 create nix-helper-db
    ```

    _Lệnh sẽ trả về `database_id` (ví dụ: `xxxx-xxxx-xxxx`). Hãy copy
    `database_id` này dán vào `worker/wrangler.jsonc`._

3. Khởi tạo bảng dữ liệu bằng schema:

    ```bash
    npx wrangler d1 execute nix-helper-db --remote --file=src/schema.sql
    ```

4. Deploy Worker lên Edge:
    ```bash
    npx wrangler deploy
    ```

Worker của bạn sẽ có URL dạng:
`https://nix-helper-analytics.<your-subdomain>.workers.dev`.

---

### Cách 2: Triển khai qua Web Dashboard Cloudflare (Không cần cài CLI)

1. Đăng nhập vào [Cloudflare Dashboard](https://dash.cloudflare.com/) > chọn
   **Workers & Pages**.
2. Nhấn **Create application** > **Create Worker** > Đặt tên
   `nix-helper-analytics` > **Deploy**.
3. Chọn **Edit code**: Copy toàn bộ nội dung từ `src/index.js` và
   `src/dashboard.js` dán vào và nhấn **Save and deploy**.
4. Vào mục **Settings** > **Variables** > Thêm biến:
    - `SALT`: Một chuỗi ngẫu nhiên bí mật bất kỳ.
    - (Tùy chọn) `DASHBOARD_SECRET`: Mật khẩu bảo vệ trang `/dashboard?key=...`.

---

## 📡 Danh Sách API Endpoints

| Method | Endpoint     | Mô Tả                                                                         |
| :----- | :----------- | :---------------------------------------------------------------------------- |
| `GET`  | `/count`     | Lấy tổng số lượt sử dụng hiện tại (trả về JSON `{ success: true, count: N }`) |
| `POST` | `/track`     | Ghi nhận lượt sử dụng, tăng bộ đếm và trả về số mới                           |
| `GET`  | `/stats`     | Lấy dữ liệu thống kê tổng hợp (JSON)                                          |
| `GET`  | `/dashboard` | Giao diện Dashboard Dark-Mode HTML trực quan                                  |
| `GET`  | `/health`    | Kiểm tra trạng thái hoạt động của Worker                                      |
