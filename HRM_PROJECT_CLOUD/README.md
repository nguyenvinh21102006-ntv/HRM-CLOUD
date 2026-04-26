# HRM_PROJECT_CLOUD

## Yêu cầu môi trường
- Node.js 18+
- MongoDB Atlas (free tier)
- npm 9+

## Cài đặt
1. Clone project
2. `npm install`
3. Tạo file `.env` và điền MongoDB URI + SESSION_SECRET
4. Chạy lệnh `npm run dev`
5. Truy cập `http://127.0.0.1:8080`

## Lỗi thường gặp & khắc phục
| Lỗi                                      | Nguyên nhân                          | Cách sửa                                      |
|------------------------------------------|--------------------------------------|-----------------------------------------------|
| `MongoNetworkError`                      | Sai URI hoặc IP không được whitelist | Vào MongoDB Atlas → Network Access → Add 0.0.0.0/0 |
| `Cannot find module 'xyz'`               | Thiếu package                        | Chạy `npm install` lại                        |
| `req.session.user is undefined`          | Session secret không đúng            | Kiểm tra `.env` và khởi động lại server       |
| `403 Forbidden - CSRF token missing`     | Chưa gửi token (nếu dùng CSRF)       | Hiện tại chưa dùng CSRF, bỏ qua nếu không cài |
| Front-End không gọi được API             | CORS hoặc sai port                   | Kiểm tra `Back-End/server.js` và `proxy` nếu dùng |

## Tài khoản mặc định
- Admin: `admin@company.com` / `Admin@123`
- Nhân viên VP: `nvp@company.com` / `123456`
- Nhân viên KD: `nvkd@company.com` / `123456`