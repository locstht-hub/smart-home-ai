from __future__ import annotations

import json
import re
import unicodedata
from typing import Any


Intent = dict[str, Any]


def normalize_text(text: str) -> str:
    lowered = text.lower()
    for bad, replacement in {"?": "", "đ": "d", "ð": "d"}.items():
        lowered = lowered.replace(bad, replacement)
    normalized = unicodedata.normalize("NFD", lowered)
    without_marks = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", without_marks).strip()


def _contains_alias(text: str, alias: str) -> bool:
    return bool(re.search(rf"(?<!\w){re.escape(alias)}(?!\w)", text))


def _contains_any(text: str, keywords: list[str]) -> bool:
    return any(_contains_alias(text, keyword) for keyword in keywords)


def _contains_word(text: str, words: list[str]) -> bool:
    return any(_contains_alias(text, word) for word in words)


def _has_control_verb(text: str) -> bool:
    return _contains_word(text, ["bat", "mo", "tat", "dong", "ngat"]) or _contains_any(text, ["kich hoat"])


def _has_negation(text: str) -> bool:
    return _contains_word(text, ["dung", "khong", "chua"])


def _control_flags(text: str) -> tuple[bool, bool]:
    wants_on = _contains_word(text, ["bat", "mo"]) or _contains_any(text, ["kich hoat"])
    wants_off = False
    for match in re.finditer(r"(?<!\w)(tat|dong|ngat)(?!\w)", text):
        # In a phrase such as "bat tat ca", the second "tat" is the
        # normalized form of "tất" (the all marker), not an off command.
        if match.group(1) == "tat" and re.match(r"\s+ca(?!\w)", text[match.end() :]):
            continue
        wants_off = True
        break
    return wants_on, wants_off


def _detect_scene(text: str) -> str | None:
    if _contains_any(text, ["bat che do ngu", "che do ngu", "di ngu", "toi di ngu"]):
        return "sleep"
    if _contains_any(text, ["vang nha", "di lam", "ra ngoai", "toi ra ngoai"]):
        return "work"
    if _contains_any(text, ["buoi sang", "chao buoi sang"]):
        return "morning"
    if _contains_any(text, ["cuoi tuan", "che do cuoi tuan"]):
        return "weekend"
    return None


def _is_question(user_text: str, text: str) -> bool:
    return any(mark in user_text for mark in ("?", "？")) or _contains_any(
        text,
        ["co nen", "tai sao", "vi sao", "lam sao", "the nao", "co phai", "khi nao", "bao gio"],
    )


ROOM_ALIASES = {
    "living": ["phong khach", "khach", "living"],
    "bedroom": ["phong ngu", "ngu", "bedroom"],
    "kitchen": ["nha bep", "phong bep", "bep", "kitchen"],
    "bathroom": ["nha ve sinh", "ve sinh", "phong tam", "toilet", "wc", "bathroom"],
    "garage": ["garage", "gara", "nha xe", "xe"],
}

DEVICE_TYPE_ALIASES = {
    "light": ["den", "bong den"],
    "fan": ["quat", "quat tran", "quat hut"],
    "ac": ["may lanh", "dieu hoa", "ac"],
    "outlet": ["o cam", "tu lanh", "cua cuon", "motor"],
}


def detect_room(text: str) -> str | None:
    for room_id, aliases in ROOM_ALIASES.items():
        if _contains_any(text, aliases):
            return room_id
    return None


def detect_rooms(text: str) -> list[str]:
    return [room_id for room_id, aliases in ROOM_ALIASES.items() if _contains_any(text, aliases)]


def _contains_device_alias(text: str, alias: str) -> bool:
    return _contains_alias(text, alias)


def detect_device_type(text: str) -> str | None:
    for device_type, aliases in DEVICE_TYPE_ALIASES.items():
        if any(_contains_device_alias(text, alias) for alias in aliases):
            return device_type
    return None


def detect_device_types(text: str) -> list[str]:
    return [
        device_type
        for device_type, aliases in DEVICE_TYPE_ALIASES.items()
        if any(_contains_device_alias(text, alias) for alias in aliases)
    ]


def _find_explicit_devices(text: str, devices: list[dict[str, Any]]) -> list[dict[str, Any]]:
    room_ids = detect_rooms(text)
    matches: list[dict[str, Any]] = []
    for device in devices:
        name = normalize_text(str(device.get("name", "")))
        if not name or not _contains_alias(text, name):
            continue
        if room_ids and device.get("roomId") not in room_ids:
            continue
        matches.append(device)

    if len(matches) < 2:
        return matches

    longest_name_length = max(len(normalize_text(str(device.get("name", "")))) for device in matches)
    return [
        device
        for device in matches
        if len(normalize_text(str(device.get("name", "")))) == longest_name_length
    ]


def collect_batch_device_ids(text: str, devices: list[dict[str, Any]]) -> list[str]:
    """Resolve each room/type phrase independently to prevent cross-room commands."""
    segments = [
        segment.strip()
        for segment in re.split(r"\s*(?:,|\bva\b|\broi\b|\bcung(?:\s+voi)?\b)\s*", text)
        if segment.strip()
    ]
    selected_ids: list[str] = []
    pending_types: list[str] = []
    previous_types: list[str] = []

    for segment in segments:
        explicit_devices = _find_explicit_devices(segment, devices)
        if explicit_devices:
            pending_group_types = list(pending_types)
            room_ids = detect_rooms(segment)
            if room_ids and pending_group_types:
                for device in devices:
                    if device.get("roomId") not in room_ids or device.get("type") not in pending_group_types:
                        continue
                    device_id = str(device["id"])
                    if device_id not in selected_ids:
                        selected_ids.append(device_id)
            for device in explicit_devices:
                device_id = str(device["id"])
                if device_id not in selected_ids:
                    selected_ids.append(device_id)
            pending_types = []
            explicit_types = [str(device.get("type")) for device in explicit_devices if device.get("type")]
            previous_types = list(
                dict.fromkeys([*pending_group_types, *explicit_types])
            )
            continue

        room_ids = detect_rooms(segment)
        device_types = detect_device_types(segment)
        if not room_ids:
            pending_types.extend(device_type for device_type in device_types if device_type not in pending_types)
            continue

        if device_types:
            target_types = [*pending_types, *device_types]
        else:
            target_types = previous_types or pending_types
        target_types = list(dict.fromkeys(target_types))

        for device in devices:
            if device.get("roomId") not in room_ids:
                continue
            if target_types and device.get("type") not in target_types:
                continue
            device_id = str(device["id"])
            if device_id not in selected_ids:
                selected_ids.append(device_id)

        if target_types:
            previous_types = target_types
        pending_types = []

    return selected_ids


def find_device(text: str, devices: list[dict[str, Any]]) -> dict[str, Any] | None:
    explicit_devices = _find_explicit_devices(text, devices)
    if len(explicit_devices) == 1:
        return explicit_devices[0]

    room_id = detect_room(text)
    device_type = detect_device_type(text)

    scored: list[tuple[int, dict[str, Any]]] = []
    for device in devices:
        if room_id and device.get("roomId") != room_id:
            continue
        if device_type and device.get("type") != device_type:
            continue
        score = 0
        device_name = normalize_text(str(device.get("name", "")))
        if room_id and device.get("roomId") == room_id:
            score += 3
        if device_type and device.get("type") == device_type:
            score += 3
        for token in device_name.split():
            if len(token) >= 3 and _contains_alias(text, token):
                score += 1
        if score > 0:
            scored.append((score, device))

    if not scored:
        return None

    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


def parse_intent(user_text: str, devices: list[dict[str, Any]]) -> Intent:
    text = normalize_text(user_text)

    if not text:
        return {"intent": "unknown"}

    # Forecast wording wins when a question also mentions current power terms.
    if _contains_any(text, ["du bao", "toi nay", "24h", "24 gio", "ngay mai"]):
        return {"intent": "get_forecast"}

    if _contains_any(text, ["danh sach thiet bi", "co nhung thiet bi nao", "liet ke thiet bi"]):
        return {"intent": "list_devices"}

    if _contains_any(text, ["cong suat", "dang dung bao nhieu dien", "dien nang hien tai", "muc tieu thu hien tai", "muc tieu thu dien", "tieu thu dien"]):
        return {"intent": "get_power_current"}

    wants_on, wants_off = _control_flags(text)
    scene = _detect_scene(text)

    if _contains_word(text, ["dang", "trang thai", "status", "state"]):
        device = find_device(text, devices)
        if device:
            return {
                "intent": "get_device_state",
                "device_id": device["id"],
                "device_name": device["name"],
            }
        return {"intent": "clarify", "reason": "unknown_state_target"}

    if wants_on and wants_off:
        return {"intent": "clarify", "reason": "mixed_control_actions"}

    if (wants_on or wants_off or scene) and _contains_any(text, ["tru", "ngoai tru", "loai tru"]):
        return {"intent": "clarify", "reason": "exclusion_control"}

    if _has_negation(text) and (_has_control_verb(text) or scene):
        return {"intent": "clarify", "reason": "negated_control"}

    if _contains_any(text, ["la gi", "la sao", "y nghia", "dung de lam gi", "nhu the nao"]):
        if scene:
            return {"intent": "explain_scene", "scene": scene}

    if _is_question(user_text, text) and (wants_on or wants_off or scene):
        return {"intent": "clarify", "reason": "question_control"}

    if scene:
        return {"intent": "apply_scene", "scene": scene}

    has_all = _contains_any(text, ["tat ca", "het thiet bi", "toan bo", "tat het"])
    room_id = detect_room(text)
    device_type = detect_device_type(text)

    if wants_on or wants_off:
        device_ids = collect_batch_device_ids(text, devices)
        if len(device_ids) > 1:
            return {"intent": "set_devices", "is_on": wants_on, "device_ids": device_ids}

    if (wants_on or wants_off) and has_all and (room_id or device_type):
        return {
            "intent": "set_filtered_devices",
            "is_on": wants_on,
            "room_id": room_id,
            "device_type": device_type,
        }

    if wants_off and has_all:
        return {"intent": "turn_off_all"}

    if wants_on and has_all:
        return {"intent": "turn_on_all"}

    if wants_on or wants_off:
        device = find_device(text, devices)
        if device:
            return {
                "intent": "turn_on_device" if wants_on else "turn_off_device",
                "device_id": device["id"],
                "device_name": device["name"],
            }

        if room_id or device_type:
            matching_devices = [
                device
                for device in devices
                if (not room_id or device.get("roomId") == room_id)
                and (not device_type or device.get("type") == device_type)
            ]
            if not matching_devices:
                return {"intent": "clarify", "reason": "no_matching_device"}
            return {
                "intent": "set_filtered_devices",
                "is_on": wants_on,
                "room_id": room_id,
                "device_type": device_type,
            }

    return {"intent": "unknown", "text": user_text}


def intent_to_json(intent: Intent) -> str:
    return json.dumps(intent, ensure_ascii=False, separators=(",", ":"))
