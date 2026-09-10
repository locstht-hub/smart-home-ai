import os
import json
import logging
import time
import urllib.request
import urllib.error

logger = logging.getLogger("telegram_notifier")

# Global cooldown memory to prevent notification spam
_last_sent_times = {}

def send_telegram_alert(message: str, alert_type: str = "general", cooldown_seconds: int = 300) -> bool:
    """
    Send an HTML-formatted Telegram alert to the configured BOT_TOKEN and CHAT_ID.
    Includes built-in rate limiting (cooldown) per alert_type to avoid spam.
    """
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()

    if not bot_token or not chat_id:
        logger.debug("Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured.")
        return False

    # Check rate limiting / cooldown
    now = time.time()
    last_sent = _last_sent_times.get(alert_type, 0)
    if now - last_sent < cooldown_seconds:
        logger.info(f"Telegram alert '{alert_type}' suppressed by cooldown ({int(now - last_sent)}s < {cooldown_seconds}s)")
        return False

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }

    try:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status == 200:
                _last_sent_times[alert_type] = now
                logger.info(f"Telegram alert '{alert_type}' sent successfully.")
                return True
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False

    return False

def format_power_quota_alert(home_id: str, current_kwh: float, limit_kwh: float, pct: float) -> str:
    """Format a standard HEMS energy limit warning message."""
    if pct >= 100.0:
        title = "🔴 <b>CẢNH BÁO HEMS - ĐÃ VƯỢT HẠN MỨC (100% QUOTA)</b>"
        action_tip = "🚨 <i>Hộ gia đình đã vượt quá hạn mức điện năng tháng! Vui lòng tắt các thiết bị công suất cao để tránh phát sinh chi phí.</i>"
    else:
        title = "🟡 <b>CẢNH BÁO HEMS - CHẠM NGƯỠNG CẢNH BÁO (SẮP ĐẠT HẠN MỨC)</b>"
        action_tip = "💡 <i>Tiêu thụ điện năng đã chạm mức 80% hạn mức. Khuyến nghị giảm bớt các thiết bị không cần thiết.</i>"

    return (
        f"{title}\n\n"
        f"🏠 <b>Hộ gia đình:</b> {home_id}\n"
        f"📊 <b>Tiêu thụ tháng:</b> <b>{current_kwh:.2f} kWh</b> / {limit_kwh:.1f} kWh (<b>{pct:.1f}%</b>)\n"
        f"{action_tip}"
    )

def format_device_anomaly_alert(device_name: str, room_name: str, current_power: float, normal_power: float) -> str:
    """Format a standard AI device anomaly detection message."""
    return (
        f"🚨 <b>CẢNH BÁO AI - BẤT THƯỜNG CÔNG SUẤT</b>\n\n"
        f"⚡ <b>Thiết bị:</b> {device_name} ({room_name})\n"
        f"📈 <b>Công suất đo:</b> <b>{current_power:.0f} W</b> (Mức bình thường: {normal_power:.0f} W)\n"
        f"🤖 <b>Chẩn đoán:</b> Thiết bị đang tiêu thụ điện tăng bất thường so với mô hình dự báo."
    )
