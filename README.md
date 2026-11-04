# Morning Note · FinSuccess

Trang tĩnh được build và publish tự động từ repo private `Morning-note`. Không sửa tay ở đây.

- `index.html`: bản tin cho khách hàng (gắn lên website bằng iframe).
- `admin.html`: trang quản trị cho team, cần key GitHub có quyền với repo `Morning-note` và repo này.
- `data/customer.json`: bản tin mới nhất, do trang admin và workflow `update-data` cập nhật.
- `.github/workflows/update-data.yml` + `tools/update.mjs`: bộ lấy tin (chạy ở đây để không tốn phút Actions). Đọc lựa chọn của team từ repo private bằng secret `MORNING_NOTE_CONFIG_TOKEN`; bộ nhớ đệm ở nhánh `data-state`.
- `.github/workflows/quotes.yml` + `tools/quotes.mjs`: lấy giá ~10 phút/lần, ghi vào nhánh `quotes` (trang đọc file này để giá mới hơn bản tin). Tiền điện tử còn được trình duyệt lấy trực tiếp từ CoinGecko mỗi phút.
