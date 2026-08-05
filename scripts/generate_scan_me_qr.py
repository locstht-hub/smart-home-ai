import argparse
import io
import os
import sys
import urllib.request
import urllib.parse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

def generate_masterpiece_poster(url, output_path="outputs/Smart_Home_Luxury_Masterpiece_Poster.png", custom_logo_path=None):
    bg_path = r"C:\Users\ADMIN\.gemini\antigravity\brain\8a5cae65-4e5c-4335-b5f8-8141176388e6\smart_home_luxury_qr_background_1785510889053.png"
    if not os.path.exists(bg_path):
        print(f"Không tìm thấy phông nền Standee tại {bg_path}")
        return

    bg_img = Image.open(bg_path).convert("RGBA")
    w, h = bg_img.size

    # Render at 3x scale for crystal-clear Supersampled Anti-Aliasing (AA)
    scale = 3
    card_w, card_h = 440 * scale, 500 * scale
    card_img = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_img)

    # Glossy White Card Container
    c_draw.rounded_rectangle((20, 20, card_w - 20, card_h - 20), radius=40 * scale, fill=(255, 255, 255, 255), outline="#00f2fe", width=6 * scale)

    # SCAN TO DOWNLOAD Glossy Pill Header
    btn_w, btn_h = int(card_w * 0.75), 70 * scale
    btn_x = (card_w - btn_w) // 2
    btn_y = 35 * scale
    c_draw.rounded_rectangle((btn_x, btn_y, btn_x + btn_w, btn_y + btn_h), radius=35 * scale, fill="#00c9a7", outline="#ffffff", width=3 * scale)

    try:
        font_btn = ImageFont.truetype("arialbd.ttf", 26 * scale)
    except Exception:
        font_btn = ImageFont.load_default()

    c_draw.text((card_w // 2, btn_y + btn_h // 2), "SCAN TO DOWNLOAD", font=font_btn, fill="#ffffff", anchor="mm")

    # Fetch QR Matrix
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&ecc=H&data={urllib.parse.quote(url)}"
    qr_bytes = urllib.request.urlopen(qr_url).read()
    raw_qr = Image.open(io.BytesIO(qr_bytes)).convert("L")

    qr_arr = np.array(raw_qr) < 128
    grid_size = qr_arr.shape[0]

    qr_canvas_size = 350 * scale
    cell_size = qr_canvas_size / grid_size

    qr_img = Image.new("RGBA", (qr_canvas_size, qr_canvas_size), (255, 255, 255, 0))
    qr_draw = ImageDraw.Draw(qr_img)

    def is_eye(r, c):
        if r < 7 and c < 7: return True
        if r < 7 and c >= grid_size - 7: return True
        if r >= grid_size - 7 and c < 7: return True
        return False

    # Soft liquid dots with cyan gradient palette
    for r in range(grid_size):
        for c in range(grid_size):
            if is_eye(r, c):
                continue
            if qr_arr[r, c]:
                pad_val = cell_size * 0.12
                x1 = c * cell_size + pad_val
                y1 = r * cell_size + pad_val
                x2 = (c + 1) * cell_size - pad_val
                y2 = (r + 1) * cell_size - pad_val
                color = "#00c9a7" if (r + c) % 3 == 0 else ("#0f766e" if (r + c) % 2 == 0 else "#0284c7")
                qr_draw.ellipse((x1, y1, x2, y2), fill=color)

    # 3 Corner Eye Finders with squircle rings
    eyes = [(0, 0), (0, grid_size - 7), (grid_size - 7, 0)]
    for er, ec in eyes:
        x1 = ec * cell_size
        y1 = er * cell_size
        x2 = (ec + 7) * cell_size
        y2 = (er + 7) * cell_size
        
        qr_draw.rounded_rectangle((x1, y1, x2, y2), radius=int(cell_size * 2.2), fill="#ffffff", outline="#0f766e", width=int(cell_size * 1.2))
        qr_draw.rounded_rectangle((x1 + cell_size, y1 + cell_size, x2 - cell_size, y2 - cell_size), radius=int(cell_size * 1.5), fill="#ffffff")
        px1 = x1 + cell_size * 2
        py1 = y1 + cell_size * 2
        px2 = x2 - cell_size * 2
        py2 = y2 - cell_size * 2
        qr_draw.rounded_rectangle((px1, py1, px2, py2), radius=int(cell_size * 1.1), fill="#00c9a7")

    # Central circular badge with Real App Icon
    logo_size = int(qr_canvas_size * 0.24)
    app_icon_path = custom_logo_path if (custom_logo_path and os.path.exists(custom_logo_path)) else r"assets/icon.png"

    if os.path.exists(app_icon_path):
        app_icon = Image.open(app_icon_path).convert("RGBA")
        app_icon = app_icon.resize((logo_size - 16 * scale, logo_size - 16 * scale), Image.Resampling.LANCZOS)
        badge = Image.new("RGBA", (logo_size, logo_size), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(badge)
        b_draw.ellipse((0, 0, logo_size, logo_size), fill="#ffffff", outline="#00c9a7", width=4 * scale)
        badge.paste(app_icon, (8 * scale, 8 * scale), app_icon)
        lx = int((qr_canvas_size - logo_size) // 2)
        ly = int((qr_canvas_size - logo_size) // 2)
        qr_img.paste(badge, (lx, ly), badge)

    # Paste QR code into card
    qx = (card_w - qr_canvas_size) // 2
    qy = btn_y + btn_h + int(20 * scale)
    card_img.paste(qr_img, (qx, qy), qr_img)

    # Downsample card to target resolution (440x500) for smooth anti-aliased finish
    final_card_w, final_card_h = 440, 500
    card_final = card_img.resize((final_card_w, final_card_h), Image.Resampling.LANCZOS)

    # Paste onto Standee Poster Background
    poster = bg_img.copy()
    pos_x = (w - final_card_w) // 2
    pos_y = 315
    poster.paste(card_final, (pos_x, pos_y), card_final)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    poster.save(output_path)
    print(f"ĐÃ TẠO MASTERPIECE STANDEE POSTER THÀNH CÔNG TẠI: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tạo Masterpiece Standee Poster Mã QR Cao Cấp")
    parser.add_argument("--url", type=str, default="https://drive.google.com/file/d/sample/view", help="Link tải file APK")
    parser.add_argument("--output", type=str, default="outputs/Smart_Home_Luxury_Masterpiece_Poster.png", help="Đường dẫn lưu file ảnh Poster mới")
    parser.add_argument("--logo", type=str, default=None, help="Đường dẫn file ảnh logo muốn chèn vào giữa QR (tùy chọn)")
    args = parser.parse_args()
    generate_masterpiece_poster(args.url, args.output, args.logo)
