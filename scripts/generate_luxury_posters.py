import argparse
import io
import os
import sys
import urllib.request
import urllib.parse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BG_PATH = r"C:\Users\ADMIN\.gemini\antigravity\brain\8a5cae65-4e5c-4335-b5f8-8141176388e6\smart_home_luxury_qr_background_1785510889053.png"
APP_ICON_PATH = r"assets/icon.png"

def make_luxury_qr_card(url, header_text="SCAN ME", subtitle_text="", app_icon_path=APP_ICON_PATH):
    scale = 3
    card_w, card_h = 440 * scale, 500 * scale
    card_img = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card_img)

    # Glossy White Card Container
    c_draw.rounded_rectangle(
        (15 * scale, 15 * scale, card_w - 15 * scale, card_h - 15 * scale),
        radius=36 * scale,
        fill=(255, 255, 255, 255),
        outline="#00f2fe",
        width=5 * scale
    )

    # Header Pill
    btn_w, btn_h = int(card_w * 0.82), 65 * scale
    btn_x = (card_w - btn_w) // 2
    btn_y = 28 * scale
    c_draw.rounded_rectangle(
        (btn_x, btn_y, btn_x + btn_w, btn_y + btn_h),
        radius=32 * scale,
        fill="#00c9a7",
        outline="#ffffff",
        width=3 * scale
    )

    try:
        font_btn = ImageFont.truetype("arialbd.ttf", 22 * scale)
        font_sub = ImageFont.truetype("arialbd.ttf", 14 * scale)
    except Exception:
        font_btn = ImageFont.load_default()
        font_sub = ImageFont.load_default()

    c_draw.text((card_w // 2, btn_y + btn_h // 2), header_text, font=font_btn, fill="#ffffff", anchor="mm")

    # Fetch QR Matrix
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&ecc=H&data={urllib.parse.quote(url)}"
    qr_bytes = urllib.request.urlopen(qr_url).read()
    raw_qr = Image.open(io.BytesIO(qr_bytes)).convert("L")

    qr_arr = np.array(raw_qr) < 128
    grid_size = qr_arr.shape[0]

    qr_canvas_size = 330 * scale
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
    if os.path.exists(app_icon_path):
        app_icon = Image.open(app_icon_path).convert("RGBA")
        app_icon = app_icon.resize((logo_size - 14 * scale, logo_size - 14 * scale), Image.Resampling.LANCZOS)
        badge = Image.new("RGBA", (logo_size, logo_size), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(badge)
        b_draw.ellipse((0, 0, logo_size, logo_size), fill="#ffffff", outline="#00c9a7", width=4 * scale)
        badge.paste(app_icon, (7 * scale, 7 * scale), app_icon)
        lx = int((qr_canvas_size - logo_size) // 2)
        ly = int((qr_canvas_size - logo_size) // 2)
        qr_img.paste(badge, (lx, ly), badge)

    # Paste QR code into card
    qx = (card_w - qr_canvas_size) // 2
    qy = btn_y + btn_h + int(12 * scale)
    card_img.paste(qr_img, (qx, qy), qr_img)

    # Subtitle text if provided
    if subtitle_text:
        sub_y = qy + qr_canvas_size + int(8 * scale)
        c_draw.text((card_w // 2, sub_y), subtitle_text, font=font_sub, fill="#0f766e", anchor="mm")

    # Downsample card to target resolution (440x500)
    return card_img.resize((440, 500), Image.Resampling.LANCZOS)

def generate_poster(card, output_path):
    if not os.path.exists(BG_PATH):
        print(f"Background not found: {BG_PATH}")
        return
    bg = Image.open(BG_PATH).convert("RGBA")
    w, h = bg.size
    pos_x = (w - card.width) // 2
    pos_y = 315
    poster = bg.copy()
    poster.paste(card, (pos_x, pos_y), card)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    poster.save(output_path)
    print(f"Saved poster: {output_path}")

def generate_dual_poster(poster_app_path, poster_web_path, output_path):
    if not os.path.exists(poster_app_path) or not os.path.exists(poster_web_path):
        return
    p_app = Image.open(poster_app_path).convert("RGBA")
    p_web = Image.open(poster_web_path).convert("RGBA")
    w, h = p_app.size
    
    gap = 40
    dual_w = w * 2 + gap
    canvas = Image.new("RGBA", (dual_w, h), (7, 17, 15, 255))

    canvas.paste(p_app, (0, 0))
    canvas.paste(p_web, (w + gap, 0))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    canvas.save(output_path)
    print(f"Saved clean dual poster: {output_path}")

def main():
    print("Generating luxury QR posters for App and Web Dashboard...")
    
    # 1. Android App Download Standee
    app_url = "https://smarthomeai.id.vn/"
    card_app = make_luxury_qr_card(
        url=app_url,
        header_text="TẢI APP ANDROID",
        subtitle_text="Quét để tải ứng dụng Smart Home AI",
        app_icon_path=APP_ICON_PATH
    )
    poster_app_path = "outputs/Smart_Home_App_Standee_Poster.png"
    generate_poster(card_app, poster_app_path)
    card_app.save("outputs/Smart_Home_App_QR_Card.png")

    # 2. Web Dashboard Standee
    web_url = "https://dashboard.smarthomeai.id.vn/"
    card_web = make_luxury_qr_card(
        url=web_url,
        header_text="WEB DASHBOARD",
        subtitle_text="dashboard.smarthomeai.id.vn",
        app_icon_path=APP_ICON_PATH
    )
    poster_web_path = "outputs/Smart_Home_Web_Standee_Poster.png"
    generate_poster(card_web, poster_web_path)
    card_web.save("outputs/Smart_Home_Web_QR_Card.png")

    # 3. Dual Showcase Poster (2 Standees side by side)
    generate_dual_poster(poster_app_path, poster_web_path, "outputs/Smart_Home_Dual_Showcase_Poster.png")

    print("All luxury QR posters generated successfully in outputs/!")

if __name__ == "__main__":
    main()
