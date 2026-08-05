import argparse
import io
import os
import sys
import urllib.request
import urllib.parse
import PIL.Image

sys.stdout.reconfigure(encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description="Tạo Poster Standee Mã QR tải App Smart Home AI")
    parser.add_argument("--url", type=str, default="https://drive.google.com/file/d/YOUR_FILE_ID/view", help="Link tải file APK (Google Drive, GitHub, Cloud...)")
    parser.add_argument("--output", type=str, default="outputs/Smart_Home_App_QR_Poster.png", help="Đường dẫn lưu file ảnh Poster mới")
    args = parser.parse_args()

    bg_poster_path = r"C:\Users\ADMIN\.gemini\antigravity\brain\8a5cae65-4e5c-4335-b5f8-8141176388e6\smart_home_qr_poster_1785510504478.png"
    if not os.path.exists(bg_poster_path):
        print(f"Lỗi: Không tìm thấy phông nền tại {bg_poster_path}")
        return

    print(f"Đang tạo mã QR cho đường dẫn: {args.url}")
    qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={urllib.parse.quote(args.url)}"
    
    try:
        qr_bytes = urllib.request.urlopen(qr_api_url).read()
        qr_img = PIL.Image.open(io.BytesIO(qr_bytes)).convert("RGBA")
    except Exception as e:
        print("Lỗi khi tải mã QR:", e)
        return

    poster = PIL.Image.open(bg_poster_path)
    w, h = poster.size
    qr_w, qr_h = qr_img.size

    pos_x = (w - qr_w) // 2
    pos_y = int(h * 0.58)

    composite = poster.copy()
    composite.paste(qr_img, (pos_x, pos_y), qr_img)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    composite.save(args.output)
    print(f"ĐÃ TẠO POSTER MÃ QR THÀNH CÔNG TẠI: {args.output}")

if __name__ == "__main__":
    main()
