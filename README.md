# NIX Digital LMS Answer Checker

**Language / Ngôn ngữ:** [English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

🎌 **Enhanced UI Version with Auto-Complete Functionality**

A powerful browser console script that automatically extracts and displays answers from NIX Digital LMS quizzes, featuring intelligent auto-completion and support for multiple question types.

## 🚀 Quick Start - One-Liner

Get the ready-to-use script here: **[📋 paste-to-console.js](https://github.com/AtelierMizumi/nix-lms-answer-checker/blob/main/paste-to-console.js)**

Copy and paste the entire content into your browser console (F12) to get started immediately!

## 🚀 Features

### Core Functionality
- **Automatic Answer Extraction**: Intercepts quiz responses via XMLHttpRequest and Fetch API
- **Multi-Type Question Support**: Handles various question formats including:
  - Type 3: Drag & drop with ordering
  - Type 4: Drag & drop positioning
  - Type 5: Matching questions
  - Type 7: Short answer/Fill-in-the-blank
  - Standard multiple choice, checkboxes, and text inputs
- **Real-time Answer Display**: Floating popup window with organized answer presentation
- **Auto-Complete**: Intelligent form filling for all supported question types

### User Interface
- **Draggable Popup Window**: Moveable interface that doesn't interfere with quiz taking
- **One-Click Copy**: Individual copy buttons for each answer
- **Visibility Toggle**: Show/hide popup without losing data
- **Minimize/Maximize**: Compact view option
- **Manual Extract Button**: Backup option for manual JSON input

### Auto-Complete Features
- **Smart Detection**: Automatically identifies question elements on the page
- **Multi-Format Support**:
  - Select2 dropdowns
  - Radio buttons and checkboxes
  - Text inputs and textareas
  - Drag & drop elements
  - Matching question dropdowns
- **Coordinate-Based Positioning**: Precise placement for drag & drop questions
- **Event Simulation**: Triggers proper change events for form validation

## 📋 Installation & Usage

### Option 1: Tampermonkey (Recommended) 🔥

Auto-loads every time you visit NIX LMS - no need to paste code manually!

1. Install [Tampermonkey](https://www.tampermonkey.net/) extension for your browser
2. Click on Tampermonkey icon → "Create a new script"
3. Delete all default content
4. Copy content from [`src/nix-helper.user.js`](https://github.com/AtelierMizumi/nix-lms-answer-checker/blob/main/src/nix-helper.user.js)
5. Paste and save (Ctrl+S)
6. Visit NIX LMS - script will load automatically!

### Option 2: Console Paste (Quick Start)

1. Open your browser's Developer Console (F12)
2. Copy and paste the entire contents of `paste-to-console.js`
3. Press Enter to execute
4. Start taking your quiz - answers will be automatically extracted!

## 🎯 Supported Question Types

### Type 3: Drag & Drop with Ordering
- Displays items with their correct order and index
- Auto-fills by positioning elements correctly

### Type 4: Drag & Drop Positioning  
- Shows content with exact coordinates (x, y)
- Automatically moves draggable elements to correct positions

### Type 5: Matching Questions
- Displays question → answer pairs
- Auto-selects correct matches in dropdown menus

### Type 7: Short Answer/Fill-in-the-blank
- Shows correct answers with their order and type
- Fills text inputs automatically

### Standard Questions
- Multiple choice (radio buttons)
- Multiple select (checkboxes)
- Text inputs and textareas
- Dropdown selections

## 🤖 Auto-Complete Controls

### Toggle Auto-Complete
- Click the **🤖** button in the popup header
- Green background = Enabled, Gray background = Disabled
- Status logged to console

### Manual Auto-Fill
- Click the **🚀** button to trigger auto-fill immediately
- Also available as "🤖 Auto-Fill" button in popup footer

### Auto-Fill Behavior
- Processes questions sequentially with 500ms delay
- Triggers proper events for form validation
- Logs progress to console for debugging

## 🔧 Technical Details

### API Interception
The script monitors these endpoints:
- `quiz-submission-check-answer` (XMLHttpRequest)
- `quiz-submission-check-answer` (Fetch API)

### JSON Structure Support
- **New Structure**: `questions` array with nested question data
- **Legacy Structure**: Direct `answers` array (backward compatibility)

### Element Detection
- Uses multiple strategies to find form elements
- Supports jQuery/Select2 integration
- Handles various CSS frameworks and custom implementations

## 📚 Available Functions

After loading the script, these global functions are available:

```javascript
// Extract answers from JSON response
nixExtract(jsonResponse)

// Toggle popup visibility
nixToggle()

// Trigger auto-fill manually
nixAutoFill()
```

## 🎨 UI Components

### Header Controls
- **👁️** - Toggle popup visibility
- **🤖/🔧** - Toggle auto-complete mode
- **🚀** - Manual auto-fill trigger
- **➖/➕** - Minimize/maximize popup
- **×** - Close popup

### Footer Actions
- **📋 Copy All** - Copy all answers to clipboard
- **🤖 Auto-Fill** - Trigger auto-completion
- **❌ Close** - Close popup window

## 🔍 Console Output

The script provides detailed console logging:
- ✅ Setup confirmation and available features
- 🎯 Quiz response detection
- 📚 Organized answer display by question
- 🤖 Auto-fill progress and results
- ⚠️ Warnings for missing elements or errors

## ⚙️ Configuration

### Auto-Complete Settings
- **Default State**: Disabled (manual activation required)
- **Delay Between Questions**: 500ms
- **Completion Timeout**: Based on question count + 1 second

### UI Positioning
- **Default Position**: Top-right corner (20px from edges)
- **Draggable**: Full popup can be repositioned
- **Z-Index**: 10000 (appears above most page elements)

## 🛠️ Troubleshooting

### Auto-Fill Not Working
1. Check if auto-complete is enabled (🤖 button should be green)
2. Verify question elements are loaded on the page
3. Check console for error messages
4. Try manual auto-fill with 🚀 button

### Answers Not Appearing
1. Ensure you're on a quiz page with active questions
2. Check Network tab for `quiz-submission-check-answer` requests
3. Try manual extraction with the "🎌 Extract Answers" button

### Drag & Drop Issues
1. Verify coordinates are being detected correctly
2. Check if jQuery UI draggable is available
3. Ensure drag area container exists on the page

## 🔒 Security & Privacy

- **Local Processing**: All operations happen in your browser
- **No Data Transmission**: Script doesn't send data to external servers
- **Console Access Only**: Requires manual installation via developer console
- **Session-Based**: No persistent storage or tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This project is provided for educational purposes. Please ensure compliance with your institution's academic integrity policies.

## 🤝 Contributing

Feel free to submit issues and enhancement requests. When contributing:
1. Test thoroughly with different question types
2. Maintain compatibility with existing features
3. Follow the existing code style and commenting conventions
4. Update documentation for new features

---

**Note**: This tool is designed to assist with learning and should be used responsibly in accordance with your educational institution's policies.

---

## Tiếng Việt

🎌 **Phiên bản giao diện nâng cao với tính năng tự động hoàn thành**

Một script console mạnh mẽ tự động trích xuất và hiển thị đáp án từ các bài kiểm tra NIX Digital LMS, có tính năng tự động hoàn thành thông minh và hỗ trợ nhiều loại câu hỏi.

## 🚀 Bắt đầu nhanh - Code một dòng

Lấy script sẵn sàng sử dụng tại đây: **[📋 paste-to-console.js](https://github.com/AtelierMizumi/nix-lms-answer-checker/blob/main/paste-to-console.js)**

Copy và paste toàn bộ nội dung vào console trình duyệt (F12) để bắt đầu ngay lập tức!

## 🚀 Tính năng

### Chức năng cốt lõi
- **Trích xuất đáp án tự động**: Chặn phản hồi bài kiểm tra qua XMLHttpRequest và Fetch API
- **Hỗ trợ nhiều loại câu hỏi**: Xử lý các định dạng câu hỏi khác nhau bao gồm:
  - Loại 3: Kéo thả với thứ tự
  - Loại 4: Kéo thả định vị
  - Loại 5: Câu hỏi ghép đôi
  - Loại 7: Câu trả lời ngắn/Điền vào chỗ trống
  - Trắc nghiệm tiêu chuẩn, checkbox và nhập văn bản
- **Hiển thị đáp án thời gian thực**: Cửa sổ popup nổi với cách trình bày đáp án có tổ chức
- **Tự động hoàn thành**: Điền form thông minh cho tất cả loại câu hỏi được hỗ trợ

### Giao diện người dùng
- **Cửa sổ popup có thể kéo**: Giao diện di chuyển được không can thiệp vào việc làm bài
- **Copy một cú nhấp**: Nút copy riêng biệt cho mỗi đáp án
- **Chuyển đổi hiển thị**: Ẩn/hiện popup mà không mất dữ liệu
- **Thu nhỏ/Phóng to**: Tùy chọn xem gọn
- **Nút trích xuất thủ công**: Tùy chọn dự phòng cho việc nhập JSON thủ công

### Tính năng tự động hoàn thành
- **Phát hiện thông minh**: Tự động nhận diện các phần tử câu hỏi trên trang
- **Hỗ trợ đa định dạng**:
  - Dropdown Select2
  - Nút radio và checkbox
  - Nhập văn bản và textarea
  - Phần tử kéo thả
  - Dropdown câu hỏi ghép đôi
- **Định vị dựa trên tọa độ**: Vị trí chính xác cho câu hỏi kéo thả
- **Mô phỏng sự kiện**: Kích hoạt sự kiện thay đổi phù hợp cho xác thực form

## 📋 Cài đặt & Sử dụng

### Bắt đầu nhanh
1. Mở Console của trình duyệt (F12)
2. Copy và paste toàn bộ nội dung của `paste-to-console.js`
3. Nhấn Enter để thực thi
4. Bắt đầu làm bài kiểm tra - đáp án sẽ được trích xuất tự động!

### Trích xuất thủ công
Nếu phát hiện tự động thất bại:
1. Nhấp vào nút "🎌 Extract Answers" (góc trên-trái)
2. Paste phản hồi JSON từ tab Network
3. Đáp án sẽ được hiển thị trong popup

## 🎯 Loại câu hỏi được hỗ trợ

### Loại 3: Kéo thả với thứ tự
- Hiển thị các mục với thứ tự và chỉ số chính xác
- Tự động điền bằng cách định vị phần tử đúng

### Loại 4: Kéo thả định vị
- Hiển thị nội dung với tọa độ chính xác (x, y)
- Tự động di chuyển phần tử kéo được đến vị trí đúng

### Loại 5: Câu hỏi ghép đôi
- Hiển thị cặp câu hỏi → đáp án
- Tự động chọn đúng ghép trong menu dropdown

### Loại 7: Câu trả lời ngắn/Điền vào chỗ trống
- Hiển thị đáp án đúng với thứ tự và loại
- Điền tự động vào ô nhập văn bản

### Câu hỏi tiêu chuẩn
- Trắc nghiệm (nút radio)
- Chọn nhiều (checkbox)
- Nhập văn bản và textarea
- Lựa chọn dropdown

## 🤖 Điều khiển tự động hoàn thành

### Chuyển đổi tự động hoàn thành
- Nhấp vào nút **🤖** trong header popup
- Nền xanh = Bật, Nền xám = Tắt
- Trạng thái được ghi vào console

### Tự động điền thủ công
- Nhấp vào nút **🚀** để kích hoạt tự động điền ngay lập tức
- Cũng có sẵn như nút "🤖 Auto-Fill" trong footer popup

### Hành vi tự động điền
- Xử lý câu hỏi tuần tự với độ trễ 500ms
- Kích hoạt sự kiện phù hợp cho xác thực form
- Ghi tiến trình vào console để debug

## 🔧 Chi tiết kỹ thuật

### Chặn API
Script giám sát các endpoint này:
- `quiz-submission-check-answer` (XMLHttpRequest)
- `quiz-submission-check-answer` (Fetch API)

### Hỗ trợ cấu trúc JSON
- **Cấu trúc mới**: Mảng `questions` với dữ liệu câu hỏi lồng nhau
- **Cấu trúc cũ**: Mảng `answers` trực tiếp (tương thích ngược)

### Phát hiện phần tử
- Sử dụng nhiều chiến lược để tìm phần tử form
- Hỗ trợ tích hợp jQuery/Select2
- Xử lý các framework CSS và triển khai tùy chỉnh khác nhau

## 📚 Hàm có sẵn

Sau khi tải script, các hàm toàn cục này có sẵn:

```javascript
// Trích xuất đáp án từ phản hồi JSON
nixExtract(jsonResponse)

// Chuyển đổi hiển thị popup
nixToggle()

// Kích hoạt tự động điền thủ công
nixAutoFill()
```

## 🎨 Thành phần giao diện

### Điều khiển header
- **👁️** - Chuyển đổi hiển thị popup
- **🤖/🔧** - Chuyển đổi chế độ tự động hoàn thành
- **🚀** - Kích hoạt tự động điền thủ công
- **➖/➕** - Thu nhỏ/phóng to popup
- **×** - Đóng popup

### Hành động footer
- **📋 Copy All** - Copy tất cả đáp án vào clipboard
- **🤖 Auto-Fill** - Kích hoạt tự động hoàn thành
- **❌ Close** - Đóng cửa sổ popup

## 🔍 Đầu ra Console

Script cung cấp ghi log console chi tiết:
- ✅ Xác nhận thiết lập và tính năng có sẵn
- 🎯 Phát hiện phản hồi bài kiểm tra
- 📚 Hiển thị đáp án có tổ chức theo câu hỏi
- 🤖 Tiến trình và kết quả tự động điền
- ⚠️ Cảnh báo cho phần tử thiếu hoặc lỗi

## ⚙️ Cấu hình

### Cài đặt tự động hoàn thành
- **Trạng thái mặc định**: Tắt (cần kích hoạt thủ công)
- **Độ trễ giữa các câu hỏi**: 500ms
- **Thời gian chờ hoàn thành**: Dựa trên số câu hỏi + 1 giây

### Định vị giao diện
- **Vị trí mặc định**: Góc trên-phải (cách mép 20px)
- **Có thể kéo**: Toàn bộ popup có thể định vị lại
- **Z-Index**: 10000 (hiện trên hầu hết phần tử trang)

## 🛠️ Khắc phục sự cố

### Tự động điền không hoạt động
1. Kiểm tra xem tự động hoàn thành có được bật không (nút 🤖 phải màu xanh)
2. Xác minh các phần tử câu hỏi đã được tải trên trang
3. Kiểm tra console để tìm thông báo lỗi
4. Thử tự động điền thủ công với nút 🚀

### Đáp án không hiện
1. Đảm bảo bạn đang ở trang bài kiểm tra với câu hỏi hoạt động
2. Kiểm tra tab Network cho các request `quiz-submission-check-answer`
3. Thử trích xuất thủ công với nút "🎌 Extract Answers"

### Vấn đề kéo thả
1. Xác minh tọa độ được phát hiện chính xác
2. Kiểm tra xem jQuery UI draggable có sẵn không
3. Đảm bảo container vùng kéo tồn tại trên trang

## 🔒 Bảo mật & Quyền riêng tư

- **Xử lý cục bộ**: Tất cả hoạt động diễn ra trong trình duyệt của bạn
- **Không truyền dữ liệu**: Script không gửi dữ liệu đến server bên ngoài
- **Chỉ truy cập Console**: Cần cài đặt thủ công qua console developer
- **Dựa trên phiên**: Không lưu trữ hoặc theo dõi liên tục

## 📄 Giấy phép

Dự án này được cấp phép theo Giấy phép MIT - xem file [LICENSE](LICENSE) để biết chi tiết.

Dự án này được cung cấp cho mục đích giáo dục. Vui lòng đảm bảo tuân thủ các chính sách toàn vẹn học thuật của tổ chức bạn.

## 🤝 Đóng góp

Hãy thoải mái gửi vấn đề và yêu cầu cải tiến. Khi đóng góp:
1. Kiểm tra kỹ lưỡng với các loại câu hỏi khác nhau
2. Duy trì tương thích với các tính năng hiện có
3. Tuân theo phong cách code và quy ước comment hiện có
4. Cập nhật tài liệu cho các tính năng mới

---

**Lưu ý**: Công cụ này được thiết kế để hỗ trợ học tập và nên được sử dụng có trách nhiệm theo chính sách của tổ chức giáo dục của bạn.