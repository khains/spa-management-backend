# Spa Management — Quản lý khách hàng Spa

Dự án gồm 2 phần:

- **backend/** — Node.js + Express + MongoDB Atlas (REST API)
- **android/** — App Android viết bằng Kotlin + Jetpack Compose + Retrofit, chỉ gọi API

---

## 1. Chạy Backend

### Yêu cầu
- Node.js >= 18
- Một cụm MongoDB Atlas (tạo miễn phí tại https://www.mongodb.com/atlas)

### Các bước

```bash
cd backend
npm install
cp .env.example .env
```

Mở file `.env` và điền:
- `MONGODB_URI`: chuỗi kết nối lấy từ MongoDB Atlas (Database → Connect → Drivers)
- `JWT_SECRET`: một chuỗi bí mật bất kỳ, càng dài càng an toàn

Tạo dữ liệu mẫu (tài khoản đăng nhập + vài gói liệu trình mẫu):

```bash
npm run seed
```

Lệnh trên tạo sẵn:
- Tài khoản admin: `admin / admin123`
- Tài khoản kỹ thuật viên: `kythuatvien1 / 123456`
- 3 gói liệu trình mẫu

Chạy server:

```bash
npm start
# hoặc khi phát triển (tự reload khi sửa code):
npm run dev
```

Server mặc định chạy ở `http://localhost:5000`. Kiểm tra nhanh:

```bash
curl http://localhost:5000/api/health
```

### Danh sách API chính

| Nhóm | Method | Endpoint | Mô tả |
|---|---|---|---|
| Auth | POST | `/api/auth/login` | Đăng nhập, trả về JWT |
| Auth | GET | `/api/auth/staff` | Danh sách nhân viên/KTV |
| Khách hàng | GET/POST | `/api/customers` | Danh sách / tạo khách hàng |
| Khách hàng | GET/PUT/DELETE | `/api/customers/:id` | Chi tiết / sửa / xóa mềm |
| Khách hàng | POST | `/api/customers/:id/notes` | Thêm ghi chú nội bộ |
| Gói mẫu | GET/POST | `/api/packages` | Danh sách / tạo mẫu gói |
| Gói của khách | GET/POST | `/api/customer-packages` | Danh sách / gán gói mới |
| Gói của khách | POST | `/api/customer-packages/:id/renew` | Gia hạn gói |
| Lịch hẹn | GET/POST | `/api/appointments` | Danh sách / đặt lịch |
| Lịch hẹn | GET | `/api/appointments/availability` | Lịch trống theo KTV/ngày |
| Lịch hẹn | POST | `/api/appointments/:id/checkin` | Check-in theo ID (tự trừ buổi) |
| Lịch hẹn | POST | `/api/appointments/checkin-by-code` | Check-in bằng mã QR |
| Lịch hẹn | POST | `/api/appointments/:id/complete` | Hoàn tất buổi + ghi kết quả |
| Thanh toán | GET/POST | `/api/payments` | Danh sách / ghi nhận thanh toán |

Mọi endpoint (trừ `/api/auth/login` và `/api/health`) đều yêu cầu header:
`Authorization: Bearer <token>`

### Triển khai lên server thật (tuỳ chọn)
Có thể deploy backend lên Render, Railway, hoặc VPS bất kỳ có Node.js. Chỉ cần:
1. Set biến môi trường giống `.env`
2. `npm install && npm start`
3. Whitelist IP của server đó trong MongoDB Atlas (Network Access)

---

## 2. Chạy App Android

### Yêu cầu
- Android Studio (bản mới nhất, ví dụ Koala/Ladybug trở lên)
- JDK 17 (đi kèm Android Studio)

### Các bước

1. Mở Android Studio → **Open** → chọn thư mục `android/`
2. Android Studio sẽ tự tải Gradle wrapper và các dependency (cần kết nối internet lần đầu)
3. Mở file `android/app/build.gradle.kts`, sửa `BASE_URL` cho khớp với backend:
   - Nếu backend chạy local + test trên **Android Emulator**: giữ nguyên `http://10.0.2.2:5000/` (10.0.2.2 là địa chỉ máy host từ trong emulator)
   - Nếu test trên **điện thoại thật** cùng mạng LAN với máy chạy backend: đổi thành `http://<IP-LAN-cua-may-tinh>:5000/`
   - Nếu đã deploy backend lên server: đổi thành `https://ten-mien-cua-ban.com/`
4. Nhấn **Run ▶** để build và cài lên emulator/thiết bị thật

### Tài khoản đăng nhập thử nghiệm
Sau khi chạy `npm run seed` ở backend:
- `admin / admin123`

### Quản lý nhân viên / kỹ thuật viên
Khi đăng nhập bằng tài khoản có vai trò **admin** (ví dụ `admin/admin123`), thanh điều hướng dưới cùng sẽ xuất hiện thêm tab **"Nhân viên"**. Tại đây admin có thể xem danh sách và tạo tài khoản mới cho lễ tân/kỹ thuật viên (chọn vai trò, đặt tên đăng nhập + mật khẩu). Tài khoản đăng nhập bằng vai trò khác (lễ tân/kỹ thuật viên) sẽ không thấy tab này, và nếu cố tình gọi thẳng API tạo nhân viên thì backend cũng sẽ từ chối (lỗi 403) vì endpoint `/api/auth/staff` (POST) chỉ cho phép `role: admin`.

### Cấu trúc app

```
android/app/src/main/java/com/spa/management/
├── data/
│   ├── api/            # Retrofit, SessionManager (lưu JWT bằng DataStore)
│   ├── model/           # Data class khớp JSON backend
│   └── repository/      # SpaRepository - lớp gọi API tập trung, xử lý lỗi
├── ui/
│   ├── auth/            # Đăng nhập
│   ├── customer/        # Danh sách / chi tiết / thêm khách hàng
│   ├── package/          # Mẫu gói liệu trình + gán gói cho khách
│   ├── appointment/      # Đặt lịch + check-in (nhập tay hoặc quét QR)
│   ├── payment/          # Ghi nhận thanh toán
│   ├── staff/            # Quản lý nhân viên (chỉ hiện tab này khi đăng nhập bằng tài khoản admin)
│   └── common/           # Thành phần dùng chung, điều hướng bottom nav
├── navigation/           # NavGraph gốc (điều hướng toàn app)
├── MainActivity.kt
└── SpaApplication.kt
```

### Ghi chú quan trọng
- App dùng `android:usesCleartextTraffic="true"` để cho phép gọi `http://` khi test local. Khi deploy backend thật, nên dùng `https://` và có thể bỏ dòng này.
- Chức năng quét mã QR check-in dùng thư viện ZXing (`journeyapps:zxing-android-embedded`), cần quyền Camera (đã khai báo sẵn trong Manifest, Android sẽ tự hỏi quyền khi mở tính năng quét lần đầu).
- Mỗi lịch hẹn khi tạo ở backend sẽ có `checkInCode` ngẫu nhiên — bạn có thể tự tạo QR từ mã này (ví dụ bằng bất kỳ tool tạo QR nào) để dán/gửi cho khách quét khi đến spa.

---

## 3. Luồng nghiệp vụ tóm tắt

1. **Tạo khách hàng** → hồ sơ với ghi chú da liễu, nguồn khách
2. **Gán gói liệu trình** cho khách (chọn từ danh sách mẫu gói đã tạo sẵn) → hệ thống tự tính ngày hết hạn = ngày bắt đầu + thời hạn gói
3. **Đặt lịch hẹn**, có thể gắn với gói liệu trình đang active của khách
4. **Check-in** khi khách đến (nhân viên bấm nút hoặc quét mã QR) → hệ thống tự động **trừ 1 buổi** trong gói, nếu dùng hết buổi thì gói tự chuyển trạng thái "completed"
5. Hệ thống tự tính và hiển thị nhãn phân loại khách: **mới / đang dùng liệu trình / VIP / sắp hết buổi (≤2) / sắp hết hạn (≤7 ngày)**
6. **Ghi nhận thanh toán** (tiền mặt / chuyển khoản / trả góp) gắn với khách và có thể gắn với gói cụ thể
7. Khi gói cũ dùng hết, có thể **gia hạn** (`/api/customer-packages/:id/renew`) để tạo gói mới liên kết tới gói cũ

---

## 4. Hạn chế hiện tại / gợi ý mở rộng thêm

- Chưa có màn hình xem "lịch trống của kỹ thuật viên" trực quan dạng lịch (mới có API `/api/appointments/availability` trả dữ liệu thô để FE tự dựng UI)
- Chưa có màn hình danh sách thanh toán/báo cáo doanh thu tổng hợp
- Xác thực JWT hiện đơn giản (chưa có refresh token, hết hạn sau 7 ngày theo `.env`)
- Có thể bổ sung: gửi thông báo/nhắc lịch qua Zalo/SMS khi khách sắp hết buổi hoặc sắp hết hạn gói
