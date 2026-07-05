from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_SYSTEM_PROMPT = """
Bạn là User Energy Assistant của app Smart Home AI. Bạn hỗ trợ người dùng cuối hiểu dữ liệu điện năng, quota/hạn mức, forecast/dự báo phụ tải, cảnh báo, biểu đồ, quyền tài khoản và cách sử dụng app.

Hãy trả lời bằng tiếng Việt tự nhiên, ngắn gọn, dễ hiểu và có gợi ý hành động khi phù hợp. Ưu tiên ngôn ngữ đời thường cho người không chuyên điện.

Phạm vi chính:
- Giải thích V là điện áp, I là dòng điện, kW là công suất hiện tại, kWh là điện năng đã tiêu thụ.
- Giải thích quota, cảnh báo vượt quota, tài khoản cha/con, quyền điều khiển và nhật ký hoạt động.
- Giải thích dữ liệu realtime, cache, mock, plc-real, forecast và biểu đồ tiêu thụ.
- Hỗ trợ người dùng hiểu trạng thái thiết bị, nhưng chỉ kết luận khi có dữ liệu từ app/backend/PLC.

Không bịa số liệu kW, kWh, V, I, phần trăm quota, tiền điện, forecast hoặc trạng thái thiết bị nếu người dùng chưa cung cấp dữ liệu và backend chưa đưa ngữ cảnh. Khi thiếu dữ liệu, hãy nói rõ cần xem trong app hoặc cần dữ liệu mới nhất từ hệ thống.

Nếu backend cung cấp dữ liệu hiện tại trong ngữ cảnh, bạn được dùng các số đó để giải thích. Nếu không có ngữ cảnh, không xác nhận các câu như "tôi còn 80% quota đúng không" hoặc "ngày mai dùng 12 kWh đúng không".

Forecast là ước lượng, không phải kết luận chắc chắn. Dữ liệu đo thực tế và thời gian cập nhật cuối nên được ưu tiên khi đánh giá trạng thái hiện tại.

Bạn không tự điều khiển thiết bị nếu chưa có công cụ điều khiển, kiểm tra quyền và phản hồi thành công từ hệ thống. Không nói "đã bật/tắt" khi chưa có xác nhận.

Bạn không phải Project Assistant. Không trả lời chi tiết về GitHub, commit, bài báo khoa học, tiến độ dự án, phản biện đồ án, đấu dây PLC hoặc triển khai kỹ thuật chuyên sâu. Với các nội dung đó, hãy nói ngắn gọn rằng câu hỏi nằm ngoài phạm vi User Energy Assistant và gợi ý chuyển sang tài liệu/kênh phù hợp.
""".strip()


def assistant_config(config: dict[str, Any]) -> dict[str, Any]:
    raw = dict(config.get("assistant") or {})
    provider = str(os.environ.get("SMART_HOME_ASSISTANT_PROVIDER") or raw.get("provider") or "mock").strip().lower()
    if provider not in {"mock", "gemini", "openai", "local_lora"}:
        provider = "mock"
    model = str(os.environ.get("SMART_HOME_ASSISTANT_MODEL") or raw.get("model") or "").strip()
    if not model and provider == "gemini":
        model = "gemini-2.0-flash"
    elif not model and provider == "openai":
        model = "gpt-4o-mini"

    return {
        "provider": provider,
        "model": model,
        "timeoutSeconds": max(3, int(os.environ.get("SMART_HOME_ASSISTANT_TIMEOUT") or raw.get("timeoutSeconds", 20))),
        "maxOutputTokens": max(64, int(raw.get("maxOutputTokens", 512))),
        "temperature": float(raw.get("temperature", 0.2)),
        "sendHomeContext": bool(raw.get("sendHomeContext", True)),
        "systemPrompt": str(raw.get("systemPrompt") or DEFAULT_SYSTEM_PROMPT).strip(),
        "localLoraUrl": str(os.environ.get("SMART_HOME_LOCAL_LORA_URL") or raw.get("localLoraUrl") or "").strip(),
    }


def run_assistant_provider(question: str, context: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    provider_config = assistant_config(config)
    provider = provider_config["provider"]

    try:
        if provider == "gemini":
            reply = call_gemini(question, context, provider_config)
        elif provider == "openai":
            reply = call_openai(question, context, provider_config)
        elif provider == "local_lora":
            reply = call_local_lora(question, context, provider_config)
        else:
            reply = mock_reply(question, context)
            provider = "mock"
        return {"ok": True, "provider": provider, "reply": reply}
    except Exception as exc:
        return {
            "ok": False,
            "provider": provider,
            "reply": mock_reply(question, context),
            "error": str(exc),
            "fallbackProvider": "mock",
        }


def build_prompt(question: str, context: dict[str, Any], include_context: bool = True) -> str:
    if not include_context:
        return question

    safe_context = json.dumps(context, ensure_ascii=False, indent=2)
    return (
        "Dữ liệu hiện tại do backend Smart Home AI cung cấp:\n"
        f"{safe_context}\n\n"
        "Hãy trả lời câu hỏi của người dùng dựa trên dữ liệu trên. "
        "Nếu dữ liệu thiếu hoặc có lỗi, hãy nói rõ chưa đủ căn cứ và không bịa số.\n\n"
        f"Câu hỏi: {question}"
    )


def call_gemini(question: str, context: dict[str, Any], config: dict[str, Any]) -> str:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    model = config["model"]
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        + urllib.parse.quote(model, safe="")
        + ":generateContent?key="
        + urllib.parse.quote(api_key, safe="")
    )
    payload = {
        "systemInstruction": {"parts": [{"text": config["systemPrompt"]}]},
        "contents": [{"role": "user", "parts": [{"text": build_prompt(question, context, config["sendHomeContext"])}]}],
        "generationConfig": {
            "temperature": config["temperature"],
            "maxOutputTokens": config["maxOutputTokens"],
        },
    }
    data = http_json(url, payload, timeout=int(config["timeoutSeconds"]))
    candidates = data.get("candidates") or []
    parts = (((candidates[0] or {}).get("content") or {}).get("parts") or []) if candidates else []
    text = "\n".join(str(part.get("text", "")).strip() for part in parts if part.get("text"))
    if not text:
        raise RuntimeError("Gemini returned an empty response")
    return text.strip()


def call_openai(question: str, context: dict[str, Any], config: dict[str, Any]) -> str:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    model = config["model"]
    payload = {
        "model": model,
        "instructions": config["systemPrompt"],
        "input": build_prompt(question, context, config["sendHomeContext"]),
        "temperature": config["temperature"],
        "max_output_tokens": config["maxOutputTokens"],
    }
    data = http_json(
        "https://api.openai.com/v1/responses",
        payload,
        timeout=int(config["timeoutSeconds"]),
        headers={"Authorization": f"Bearer {api_key}"},
    )
    text = str(data.get("output_text") or "").strip()
    if text:
        return text

    chunks: list[str] = []
    for item in data.get("output") or []:
        for content in item.get("content") or []:
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(str(content["text"]))
    text = "\n".join(chunks).strip()
    if not text:
        raise RuntimeError("OpenAI returned an empty response")
    return text


def call_local_lora(question: str, context: dict[str, Any], config: dict[str, Any]) -> str:
    url = config["localLoraUrl"]
    if not url:
        raise RuntimeError("localLoraUrl is not configured")

    data = http_json(
        url,
        {
            "message": question,
            "context": context if config["sendHomeContext"] else {},
            "systemPrompt": config["systemPrompt"],
        },
        timeout=int(config["timeoutSeconds"]),
    )
    text = str(data.get("reply") or data.get("text") or data.get("message") or "").strip()
    if not text:
        raise RuntimeError("Local LoRA server returned an empty response")
    return text


def http_json(
    url: str,
    payload: dict[str, Any],
    *,
    timeout: int,
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code}: {detail[:500]}") from exc


def mock_reply(question: str, context: dict[str, Any]) -> str:
    text = question.strip().lower()
    power = context.get("power") or {}
    quota = context.get("quota") or {}
    devices = context.get("devices") or []

    if any(term in text for term in ["kw", "kwh", "công suất", "dien nang", "điện năng"]):
        return (
            "kW là công suất hiện tại, còn kWh là tổng điện năng đã tiêu thụ theo thời gian. "
            "Nếu bạn hỏi số cụ thể, mình cần dữ liệu mới nhất từ app/backend để tránh bịa số."
        )

    if "quota" in text or "hạn mức" in text:
        limit = quota.get("energyLimitKwh")
        current = quota.get("currentMonthEnergyKwh")
        if isinstance(limit, (int, float)) and isinstance(current, (int, float)) and limit > 0:
            percent = min(999.0, current / limit * 100)
            return f"Quota tháng hiện tại đang dùng khoảng {current} / {limit} kWh, tương đương {percent:.1f}%. Bạn nên theo dõi thêm nếu gần 100%."
        return "Quota là hạn mức điện năng đã đặt cho nhà. Hiện mình chưa có đủ dữ liệu quota mới nhất để kết luận còn bao nhiêu."

    if "mock" in text or "plc" in text or "server" in text:
        return (
            f"Backend hiện báo chế độ {context.get('serverMode', 'không rõ')}. "
            "Nếu là mock thì dữ liệu chỉ để demo; nếu là plc-real thì vẫn nên xem thời gian cập nhật cuối."
        )

    if "thiết bị" in text or "đèn" in text:
        if devices:
            active = [item for item in devices if item.get("isOn")]
            return f"Hệ thống hiện có {len(devices)} thiết bị trong ngữ cảnh, trong đó {len(active)} thiết bị đang bật theo dữ liệu backend."
        return "Mình cần danh sách thiết bị và trạng thái mới nhất từ app/backend để trả lời chính xác."

    if power.get("error"):
        return "Mình chưa đọc được dữ liệu điện mới nhất, nên chưa đủ căn cứ để kết luận. Bạn hãy kiểm tra kết nối server/PLC và thử lại."

    return (
        "Mình có thể hỗ trợ giải thích điện năng, quota, forecast, cảnh báo, trạng thái thiết bị và cách dùng app. "
        "Nếu câu hỏi cần số liệu thật, backend phải cung cấp dữ liệu mới nhất để mình trả lời chính xác."
    )

