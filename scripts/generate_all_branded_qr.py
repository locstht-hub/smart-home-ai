import io
import os
import sys
import urllib.request
import urllib.parse
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BG_PATH = r"C:\Users\ADMIN\.gemini\antigravity\brain\8a5cae65-4e5c-4335-b5f8-8141176388e6\smart_home_luxury_qr_background_1785510889053.png"
APP_ICON_PATH = os.path.join(ROOT, "assets", "icon.png")

def create_branded_qr(url, size=382, logo_path=APP_ICON_PATH, dark_dots=True):
    """
    Creates a high-contrast, scan-reliable QR code with the real Smart Home 3D app icon in center.
    """
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&ecc=H&data={urllib.parse.quote(url)}"
    qr_bytes = urllib.request.urlopen(qr_url).read()
    raw_qr = Image.open(io.BytesIO(qr_bytes)).convert("L")

    qr_arr = np.array(raw_qr) < 128
    grid_size = qr_arr.shape[0]

    # Render at 3x scale for crisp anti-aliasing
    scale = 3
    target_scale = size * scale
    canvas = Image.new("RGBA", (target_scale, target_scale), (255, 255, 255, 255))
    draw = ImageDraw.Draw(canvas)

    quiet_zone_modules = 2
    total_modules = grid_size + quiet_zone_modules * 2
    cell_size = target_scale / total_modules
    offset = quiet_zone_modules * cell_size

    def is_eye(r, c):
        if r < 7 and c < 7: return True
        if r < 7 and c >= grid_size - 7: return True
        if r >= grid_size - 7 and c < 7: return True
        return False

    # Draw QR dots
    for r in range(grid_size):
        for c in range(grid_size):
            if is_eye(r, c):
                continue
            if qr_arr[r, c]:
                pad = cell_size * 0.08
                x1 = offset + c * cell_size + pad
                y1 = offset + r * cell_size + pad
                x2 = offset + (c + 1) * cell_size - pad
                y2 = offset + (r + 1) * cell_size - pad
                color = "#07110f" if dark_dots else ("#00c9a7" if (r + c) % 3 == 0 else "#0f766e")
                draw.rounded_rectangle((x1, y1, x2, y2), radius=int(cell_size * 0.28), fill=color)

    # 3 Corner Finder Eyes with smooth squircle styling
    eyes = [(0, 0), (0, grid_size - 7), (grid_size - 7, 0)]
    for er, ec in eyes:
        x1 = offset + ec * cell_size
        y1 = offset + er * cell_size
        x2 = offset + (ec + 7) * cell_size
        y2 = offset + (er + 7) * cell_size

        draw.rounded_rectangle((x1, y1, x2, y2), radius=int(cell_size * 2.2), fill="#ffffff", outline="#07110f", width=int(cell_size * 1.0))
        draw.rounded_rectangle((x1 + cell_size, y1 + cell_size, x2 - cell_size, y2 - cell_size), radius=int(cell_size * 1.5), fill="#ffffff")
        px1 = x1 + cell_size * 2
        py1 = y1 + cell_size * 2
        px2 = x2 - cell_size * 2
        py2 = y2 - cell_size * 2
        draw.rounded_rectangle((px1, py1, px2, py2), radius=int(cell_size * 1.1), fill="#0f766e" if dark_dots else "#00c9a7")

    # Center Logo Avatar (25% size with white backing and cyan outline)
    if os.path.exists(logo_path):
        logo_w = int(target_scale * 0.25)
        badge = Image.new("RGBA", (logo_w, logo_w), (0, 0, 0, 0))
        b_draw = ImageDraw.Draw(badge)

        # White squircle backing for high contrast
        b_draw.rounded_rectangle((0, 0, logo_w, logo_w), radius=int(logo_w * 0.24), fill="#ffffff", outline="#00c9a7", width=int(3 * scale))

        # Paste app icon inside
        icon_img = Image.open(logo_path).convert("RGBA")
        inner_pad = int(4 * scale)
        inner_w = logo_w - inner_pad * 2
        icon_resized = icon_img.resize((inner_w, inner_w), Image.Resampling.LANCZOS)
        
        # Rounded mask for icon
        mask = Image.new("L", (inner_w, inner_w), 0)
        m_draw = ImageDraw.Draw(mask)
        m_draw.rounded_rectangle((0, 0, inner_w, inner_w), radius=int(inner_w * 0.22), fill=255)
        
        badge.paste(icon_resized, (inner_pad, inner_pad), mask)

        lx = (target_scale - logo_w) // 2
        ly = (target_scale - logo_w) // 2
        canvas.paste(badge, (lx, ly), badge)

    return canvas.resize((size, size), Image.Resampling.LANCZOS)

def make_standee_card(qr_img, header_text, subtitle_text):
    scale = 3
    card_w, card_h = 440 * scale, 500 * scale
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(card)

    # Glossy container
    draw.rounded_rectangle(
        (12 * scale, 12 * scale, card_w - 12 * scale, card_h - 12 * scale),
        radius=36 * scale,
        fill=(255, 255, 255, 255),
        outline="#00f2fe",
        width=5 * scale
    )

    # Header Pill
    btn_w, btn_h = int(card_w * 0.82), 65 * scale
    btn_x = (card_w - btn_w) // 2
    btn_y = 28 * scale
    draw.rounded_rectangle(
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

    draw.text((card_w // 2, btn_y + btn_h // 2), header_text, font=font_btn, fill="#ffffff", anchor="mm")

    # Paste QR in card center
    qr_scaled = qr_img.resize((330 * scale, 330 * scale), Image.Resampling.LANCZOS)
    qx = (card_w - qr_scaled.width) // 2
    qy = btn_y + btn_h + int(12 * scale)
    card.paste(qr_scaled, (qx, qy), qr_scaled)

    # Subtitle
    if subtitle_text:
        sub_y = qy + qr_scaled.height + int(10 * scale)
        draw.text((card_w // 2, sub_y), subtitle_text, font=font_sub, fill="#0f766e", anchor="mm")

    return card.resize((440, 500), Image.Resampling.LANCZOS)

def generate_poster(card, output_path):
    if not os.path.exists(BG_PATH):
        return
    bg = Image.open(BG_PATH).convert("RGBA")
    w, h = bg.size
    pos_x = (w - card.width) // 2
    pos_y = 315
    poster = bg.copy()
    poster.paste(card, (pos_x, pos_y), card)
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    poster.save(output_path)

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

def main():
    print("Generating Branded QR codes with App Avatar in center...")
    
    app_url = "https://smarthomeai.id.vn/"
    web_url = "https://dashboard.smarthomeai.id.vn/"

    # 1. Generate QR codes for Project Site (with App Avatar in center)
    site_app_qr = create_branded_qr(app_url, size=382, logo_path=APP_ICON_PATH, dark_dots=True)
    site_web_qr = create_branded_qr(web_url, size=382, logo_path=APP_ICON_PATH, dark_dots=True)
    
    site_assets_dir = os.path.join(ROOT, "project-site", "assets")
    os.makedirs(site_assets_dir, exist_ok=True)
    site_app_qr.save(os.path.join(site_assets_dir, "app-download-qr.png"))
    site_web_qr.save(os.path.join(site_assets_dir, "web-dashboard-qr.png"))
    print("Updated project-site/assets/app-download-qr.png and web-dashboard-qr.png")

    # 2. Generate Standee Posters
    card_app = make_standee_card(site_app_qr, "TẢI APP ANDROID", "Quét để tải ứng dụng Smart Home AI")
    card_web = make_standee_card(site_web_qr, "WEB DASHBOARD", "dashboard.smarthomeai.id.vn")

    poster_app_path = os.path.join(ROOT, "outputs", "Smart_Home_App_Standee_Poster.png")
    poster_web_path = os.path.join(ROOT, "outputs", "Smart_Home_Web_Standee_Poster.png")
    dual_poster_path = os.path.join(ROOT, "outputs", "Smart_Home_Dual_Showcase_Poster.png")

    generate_poster(card_app, poster_app_path)
    generate_poster(card_web, poster_web_path)
    generate_dual_poster(poster_app_path, poster_web_path, dual_poster_path)

    card_app.save(os.path.join(ROOT, "outputs", "Smart_Home_App_QR_Card.png"))
    card_web.save(os.path.join(ROOT, "outputs", "Smart_Home_Web_QR_Card.png"))

    print("Standee posters generated successfully in outputs/")

if __name__ == "__main__":
    main()
