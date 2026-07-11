from __future__ import annotations

import json
import math
import os
import re
import threading
import time
from hmac import compare_digest
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from assistant_runtime import assistant_config, run_assistant_provider
from assistant_intents import parse_intent
from auth_store import AuthStore

try:
    import snap7
    from snap7.util import get_bool, get_dword, get_real, set_bool
except Exception:  # pragma: no cover
    snap7 = None  # type: ignore
    get_bool = None  # type: ignore
    get_dword = None  # type: ignore
    get_real = None  # type: ignore
    set_bool = None  # type: ignore


BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "config.json"
STATE_PATH = BASE_DIR / "device_state.json"
AUTH_DB_PATH = BASE_DIR / "smart_home_auth.db"

load_dotenv(BASE_DIR / ".env")


def load_config() -> dict[str, Any]:
    with CONFIG_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def group_devices(devices: list[dict[str, Any]], states: dict[str, bool]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {
        "living": [],
        "bedroom": [],
        "kitchen": [],
        "garage": [],
    }

    for item in devices:
        room_id = str(item["roomId"])
        grouped.setdefault(room_id, []).append(
            {
                "id": item["id"],
                "name": item["name"],
                "type": item["type"],
                "isOn": bool(states.get(item["id"], False)),
                "power": item["power"],
                "roomId": room_id,
                "source": "server",
                "available": True,
            }
        )

    return grouped


ASSISTANT_REPLY_REPLACEMENTS = (
    ("Ban hay nhap lenh can dieu khien hoac cau hoi ve dien nang.", "Bạn hãy nhập lệnh cần điều khiển hoặc câu hỏi về điện năng."),
    ("Khong the doc du lieu dien nang", "Không thể đọc dữ liệu điện năng"),
    ("Cong suat hien tai khoang", "Công suất hiện tại khoảng"),
    ("Khong the tat tat ca thiet bi", "Không thể tắt tất cả thiết bị"),
    ("Khong the bat tat ca thiet bi", "Không thể bật tất cả thiết bị"),
    ("Khong the kich hoat canh", "Không thể kích hoạt cảnh"),
    ("Khong tim thay thiet bi", "Không tìm thấy thiết bị"),
    ("Chi gui duoc lenh cho", "Chỉ gửi được lệnh cho"),
    ("thiet bi loi", "thiết bị lỗi"),
    ("thiet bi phu hop", "thiết bị phù hợp"),
    ("Da gui lenh tat tat ca thiet bi.", "Đã gửi lệnh tắt tất cả thiết bị."),
    ("Da gui lenh bat tat ca thiet bi.", "Đã gửi lệnh bật tất cả thiết bị."),
    ("Da kich hoat canh", "Đã kích hoạt cảnh"),
    ("Da gui lenh bat", "Đã gửi lệnh bật"),
    ("Da gui lenh tat", "Đã gửi lệnh tắt"),
    ("Da gui lenh cho", "Đã gửi lệnh cho"),
    ("He thong dang co", "Hệ thống đang có"),
    ("thiet bi trong", "thiết bị trong"),
    ("khu vuc", "khu vực"),
    ("Chuc nang du bao se doc Forecast API sau khi co du lieu lich su tu PLC.", "Chức năng dự báo sẽ đọc Forecast API sau khi có dữ liệu lịch sử từ PLC."),
    ("server loi", "server lỗi"),
    ("Den phong khach", "Đèn phòng khách"),
    ("Den phong bep", "Đèn phòng bếp"),
    ("Den phong ngu", "Đèn phòng ngủ"),
)


def repair_mojibake(text: str) -> str:
    if "Ã" not in text and "áº" not in text and "Ä" not in text:
        return text
    try:
        repaired = text.encode("latin1").decode("utf-8")
    except UnicodeError:
        return text
    original_bad_markers = sum(text.count(marker) for marker in ("Ã", "áº", "Ä"))
    repaired_bad_markers = sum(repaired.count(marker) for marker in ("Ã", "áº", "Ä"))
    return repaired if repaired_bad_markers < original_bad_markers else text


def polish_assistant_reply(reply: Any) -> str:
    text = repair_mojibake(str(reply or ""))
    for old, new in ASSISTANT_REPLY_REPLACEMENTS:
        text = text.replace(old, new)
    return text


def parse_m_bit_tag(tag: str) -> tuple[int, int]:
    raw = tag.strip().upper()
    if not raw.startswith("M") or "." not in raw:
        raise ValueError(f"Unsupported M bit tag: {tag}")

    byte_str, bit_str = raw[1:].split(".", 1)
    byte_index = int(byte_str)
    bit_index = int(bit_str)
    if bit_index < 0 or bit_index > 7:
        raise ValueError(f"Invalid M bit index in tag: {tag}")
    return byte_index, bit_index


DB_BIT_PATTERN = re.compile(r"^DB(?P<db>\d+)\.DBX(?P<byte>\d+)\.(?P<bit>[0-7])$", re.IGNORECASE)


def parse_plc_bit_tag(tag: str) -> dict[str, int | str]:
    raw = tag.strip().upper()
    if raw.startswith("M") and "." in raw:
        byte_index, bit_index = parse_m_bit_tag(raw)
        return {"area": "M", "byte": byte_index, "bit": bit_index}

    match = DB_BIT_PATTERN.match(raw)
    if match:
        return {
            "area": "DB",
            "db": int(match.group("db")),
            "byte": int(match.group("byte")),
            "bit": int(match.group("bit")),
        }

    raise ValueError(f"Unsupported PLC bit tag: {tag}. Use M100.0 or DB1.DBX1.2.")


def bit_tag_key(parsed: dict[str, int | str]) -> tuple[int | str, ...]:
    if parsed["area"] == "M":
        return ("M", int(parsed["byte"]), int(parsed["bit"]))
    return ("DB", int(parsed["db"]), int(parsed["byte"]), int(parsed["bit"]))


def bit_tag_address(parsed: dict[str, int | str]) -> str:
    if parsed["area"] == "M":
        return f"M{parsed['byte']}.{parsed['bit']}"
    return f"DB{parsed['db']}.DBX{parsed['byte']}.{parsed['bit']}"


def power_tag_size(data_type: str) -> int:
    normalized = data_type.strip().lower()
    if normalized in {"dword", "real"}:
        return 4
    raise ValueError(f"Unsupported power tag type: {data_type}")


def validate_plc_memory_layout(config: dict[str, Any], devices: list[dict[str, Any]]) -> None:
    power_ranges: list[tuple[str, int, int]] = []
    for key, tag in dict(config.get("powerTags", {})).items():
        start = int(tag["address"])
        size = power_tag_size(str(tag.get("type", "DWord")))
        power_ranges.append((str(key), start, start + size - 1))

    bit_tags: list[tuple[str, str, dict[str, int | str]]] = []
    seen_bits: dict[tuple[int | str, ...], str] = {}
    seen_command_bits: dict[tuple[int | str, ...], str] = {}
    for device in devices:
        device_id = str(device.get("id", "unknown_device"))
        for field in ("statusTag", "commandTag", "onCommandTag", "offCommandTag"):
            if field not in device:
                continue
            parsed = parse_plc_bit_tag(str(device[field]))
            label = f"{device_id}.{field}"
            bit_tags.append((label, field, parsed))

            physical_key = bit_tag_key(parsed)
            bit_key = (*physical_key, field)
            if bit_key in seen_bits:
                raise ValueError(f"PLC memory conflict: {label} duplicates {seen_bits[bit_key]} at {bit_tag_address(parsed)}")
            seen_bits[bit_key] = label

            if field in {"commandTag", "onCommandTag", "offCommandTag"}:
                previous_command = seen_command_bits.get(physical_key)
                if previous_command:
                    raise ValueError(
                        f"PLC memory conflict: {label} duplicates command bit {previous_command} at {bit_tag_address(parsed)}"
                    )
                seen_command_bits[physical_key] = label

    status_bits = {bit_tag_key(parsed): label for label, field, parsed in bit_tags if field == "statusTag"}
    command_bits = {
        bit_tag_key(parsed): label
        for label, field, parsed in bit_tags
        if field in {"commandTag", "onCommandTag", "offCommandTag"}
    }
    for bit_key, status_label in status_bits.items():
        command_label = command_bits.get(bit_key)
        if command_label:
            raise ValueError(
                f"PLC memory conflict: {status_label} and {command_label} both use {bit_key}. "
                "Status feedback and app command bits must be separated."
            )

    for label, _field, parsed in bit_tags:
        if parsed["area"] != "M":
            continue
        byte_index = int(parsed["byte"])
        bit_index = int(parsed["bit"])
        for power_key, start, end in power_ranges:
            if start <= byte_index <= end:
                raise ValueError(
                    f"PLC memory conflict: {label} uses M{byte_index}.{bit_index}, "
                    f"inside power tag {power_key} range MD{start}-MD{end}. "
                    "Power MD tags must not overlap device status/command bits."
                )

    sorted_ranges = sorted(power_ranges, key=lambda item: item[1])
    for index in range(1, len(sorted_ranges)):
        prev_key, prev_start, prev_end = sorted_ranges[index - 1]
        key, start, end = sorted_ranges[index]
        if start <= prev_end:
            raise ValueError(
                f"PLC memory conflict: power tag {key} MD{start}-MD{end} overlaps "
                f"{prev_key} MD{prev_start}-MD{prev_end}."
            )


class StateStore:
    def __init__(self, devices: list[dict[str, Any]]) -> None:
        self.devices = devices

    def load(self) -> dict[str, bool]:
        if STATE_PATH.exists():
            try:
                with STATE_PATH.open("r", encoding="utf-8") as f:
                    raw = json.load(f)
                return {str(k): bool(v) for k, v in raw.items()}
            except json.JSONDecodeError:
                pass

        initial = {str(item["id"]): False for item in self.devices}
        self.save(initial)
        return initial

    def save(self, states: dict[str, bool]) -> None:
        with STATE_PATH.open("w", encoding="utf-8") as f:
            json.dump(states, f, indent=2)

    def set_state(self, device_id: str, is_on: bool) -> None:
        states = self.load()
        states[device_id] = is_on
        self.save(states)


class S7Client:
    def __init__(self, config: dict[str, Any]) -> None:
        plc = config.get("plc", {})
        self.host = str(plc.get("host", "192.168.0.1"))
        self.rack = int(plc.get("rack", 0))
        self.slot = int(plc.get("slot", 1))
        self.command_pulse_ms = max(50, int(plc.get("commandPulseMs", 200)))
        self.feedback_timeout_ms = max(250, int(plc.get("feedbackTimeoutMs", 2500)))
        self.feedback_poll_ms = max(25, int(plc.get("feedbackPollMs", 100)))
        # A PLC bit write is a read-modify-write operation. Serializing all S7 I/O
        # prevents concurrent commands from clobbering neighboring bits.
        self._io_lock = threading.RLock()

    def _client(self) -> Any:
        if snap7 is None:
            raise RuntimeError("python-snap7 is not installed")

        client = snap7.client.Client()
        client.connect(self.host, self.rack, self.slot)
        if not client.get_connected():
            raise RuntimeError(f"Cannot connect to PLC at {self.host}")
        return client

    @staticmethod
    def parse_m_bit(tag: str) -> tuple[int, int]:
        return parse_m_bit_tag(tag)

    @staticmethod
    def parse_bit_tag(tag: str) -> dict[str, int | str]:
        return parse_plc_bit_tag(tag)

    @staticmethod
    def read_plc_bit(client: Any, tag: str) -> bool:
        parsed = parse_plc_bit_tag(tag)
        if get_bool is None:
            raise RuntimeError("python-snap7 is not installed")
        if parsed["area"] == "M":
            data = client.mb_read(int(parsed["byte"]), 1)
        else:
            data = client.db_read(int(parsed["db"]), int(parsed["byte"]), 1)
        return bool(get_bool(data, 0, int(parsed["bit"])))

    @staticmethod
    def write_plc_bit(client: Any, tag: str, value: bool) -> None:
        parsed = parse_plc_bit_tag(tag)
        if set_bool is None:
            raise RuntimeError("python-snap7 is not installed")
        if parsed["area"] == "M":
            data = client.mb_read(int(parsed["byte"]), 1)
            set_bool(data, 0, int(parsed["bit"]), value)
            client.mb_write(int(parsed["byte"]), 1, data)
            return

        data = client.db_read(int(parsed["db"]), int(parsed["byte"]), 1)
        set_bool(data, 0, int(parsed["bit"]), value)
        client.db_write(int(parsed["db"]), int(parsed["byte"]), data)

    @staticmethod
    def read_number(buffer: bytearray, offset: int, data_type: str, scale: float) -> float:
        normalized = data_type.strip().lower()
        if normalized == "real":
            if get_real is None:
                raise RuntimeError("python-snap7 is not installed")
            return float(get_real(buffer, offset)) * scale

        if normalized == "dword":
            if get_dword is None:
                raise RuntimeError("python-snap7 is not installed")
            return float(get_dword(buffer, offset)) * scale

        raise ValueError(f"Unsupported power tag type: {data_type}")

    def read_power(self, tags: dict[str, Any]) -> dict[str, Any]:
        addresses = [int(tag["address"]) for tag in tags.values()]
        start = min(addresses)
        end = max(address + 4 for address in addresses)

        with self._io_lock:
            client = self._client()
            try:
                data = client.mb_read(start, end - start)
            finally:
                client.disconnect()

        values: dict[str, Any] = {}
        warnings: list[str] = []
        for key, tag in tags.items():
            address = int(tag["address"])
            raw_value = self.read_number(
                data,
                address - start,
                str(tag.get("type", "DWord")),
                float(tag.get("scale", 1.0)),
            )
            min_value = tag.get("min")
            max_value = tag.get("max")

            if (
                not math.isfinite(raw_value)
                or (min_value is not None and raw_value < float(min_value))
                or (max_value is not None and raw_value > float(max_value))
            ):
                warnings.append(
                    f"{key}={raw_value} outside expected range "
                    f"{min_value if min_value is not None else '-inf'}..{max_value if max_value is not None else '+inf'}"
                )
                values[key] = None
                continue

            values[key] = round(raw_value, 4)

        values["_warnings"] = warnings
        return values

    def read_device_states(self, devices: list[dict[str, Any]]) -> dict[str, bool]:
        states: dict[str, bool] = {}
        with self._io_lock:
            client = self._client()
            try:
                for item in devices:
                    states[str(item["id"])] = self.read_plc_bit(client, str(item["statusTag"]))
            finally:
                client.disconnect()

        return states

    def write_device_command(self, device: dict[str, Any], is_on: bool) -> dict[str, Any]:
        command_tag = device.get("onCommandTag" if is_on else "offCommandTag")
        status_tag = str(device.get("statusTag") or "").strip()
        if not status_tag:
            raise RuntimeError(f"Device {device.get('id')} has no independent statusTag for feedback verification")

        started = time.perf_counter()
        with self._io_lock:
            client = self._client()
            try:
                if command_tag:
                    self.write_plc_bit(client, str(command_tag), True)
                    time.sleep(self.command_pulse_ms / 1000.0)
                    self.write_plc_bit(client, str(command_tag), False)
                else:
                    self.write_plc_bit(client, str(device["commandTag"]), is_on)

                deadline = time.perf_counter() + (self.feedback_timeout_ms / 1000.0)
                actual_state = self.read_plc_bit(client, status_tag)
                while actual_state != is_on and time.perf_counter() < deadline:
                    time.sleep(self.feedback_poll_ms / 1000.0)
                    actual_state = self.read_plc_bit(client, status_tag)

                elapsed_ms = round((time.perf_counter() - started) * 1000.0, 2)
                if actual_state != is_on:
                    raise RuntimeError(
                        f"PLC feedback timeout for {device.get('id')}: expected {is_on}, got {actual_state} "
                        f"after {elapsed_ms} ms"
                    )
                return {"verified": True, "actualState": actual_state, "latencyMs": elapsed_ms}
            finally:
                client.disconnect()


def create_app() -> Flask:
    config = load_config()
    devices = list(config.get("devices", []))
    validate_plc_memory_layout(config, devices)
    mode = str(config.get("mode", "mock")).strip().lower()
    if mode not in {"mock", "plc-real", "auto"}:
        mode = "mock"
    collector_config = dict(config.get("powerCollector", {}))
    collector_interval = max(5, int(collector_config.get("intervalSeconds", 60)))
    collector_enabled = bool(collector_config.get("enabled", False))
    collector_home_ids = [str(item).strip() for item in collector_config.get("homeIds", []) if str(item).strip()]
    safety_config = dict(config.get("safety", {}))
    auto_shedding_env = os.environ.get("SMART_HOME_AUTO_LOAD_SHEDDING_ENABLED")
    auto_load_shedding_enabled = (
        auto_shedding_env.strip().lower() in {"1", "true", "yes", "on"}
        if auto_shedding_env is not None
        else bool(safety_config.get("autoLoadSheddingEnabled", False))
    )
    telemetry_config = dict(config.get("telemetry", {}))
    telemetry_service_token = str(
        os.environ.get("SMART_HOME_TELEMETRY_TOKEN")
        or telemetry_config.get("serviceToken", "")
    ).strip()
    telemetry_allowed_home_ids = {
        str(item).strip()
        for item in telemetry_config.get("allowedHomeIds", collector_home_ids)
        if str(item).strip()
    }
    mock_energy_kwh = float(collector_config.get("initialEnergyKwh", 12.3))
    last_mock_energy_update = datetime.now(timezone.utc)
    energy_lock = threading.Lock()
    collector_stop_event = threading.Event()
    collector_status: dict[str, Any] = {
        "enabled": collector_enabled,
        "running": False,
        "intervalSeconds": collector_interval,
        "homeIds": collector_home_ids,
        "lastRunAt": None,
        "lastSuccessAt": None,
        "lastError": None,
        "lastReadingCount": 0,
        "totalReadings": 0,
    }
    collector_status_lock = threading.Lock()
    state_store = StateStore(devices)
    s7 = S7Client(config)
    configured_db_path = Path(str(config.get("database", {}).get("path", AUTH_DB_PATH)))
    if not configured_db_path.is_absolute():
        configured_db_path = BASE_DIR / configured_db_path
    database_url = os.environ.get("DATABASE_URL", "").strip()
    database_kind = "postgres" if database_url else "sqlite"
    database_label = "Supabase/Postgres via DATABASE_URL" if database_url else str(configured_db_path.resolve())
    if database_url:
        from postgres_auth_store import PostgresAuthStore

        auth_store = PostgresAuthStore(database_url)
    else:
        auth_store = AuthStore(configured_db_path)

    app = Flask(__name__)
    app.json.ensure_ascii = False
    api_token = str(os.environ.get("SMART_HOME_API_TOKEN") or config.get("security", {}).get("apiToken", "")).strip()

    @app.after_request
    def add_cors_headers(response: Any) -> Any:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Token, X-Telemetry-Token"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        return response

    def extract_token() -> str:
        auth_header = request.headers.get("Authorization", "").strip()
        if auth_header.lower().startswith("bearer "):
            return auth_header[7:].strip()
        return request.headers.get("X-API-Token", "").strip()

    def get_current_user() -> dict[str, Any] | None:
        token = extract_token()
        if api_token and compare_digest(token, api_token):
            return {"id": "api-token", "role": "system_admin", "name": "API Token"}
        return auth_store.get_user_by_session(token)

    def telemetry_service_authenticated() -> bool:
        supplied = request.headers.get("X-Telemetry-Token", "").strip()
        return bool(telemetry_service_token and supplied and compare_digest(supplied, telemetry_service_token))

    @app.before_request
    def require_api_token() -> Any:
        if request.method == "OPTIONS" or not request.path.startswith("/api/") or request.path == "/api/auth/login":
            return None

        if request.path == "/api/power/readings" and request.method == "POST":
            if not telemetry_service_token:
                return jsonify({"ok": False, "error": "Telemetry ingestion is disabled until SMART_HOME_TELEMETRY_TOKEN is configured"}), 503
            if not telemetry_service_authenticated():
                return jsonify({"ok": False, "error": "Telemetry service authentication required"}), 401
            return None

        if get_current_user() is None:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401

        return None

    def require_system_admin() -> dict[str, Any] | tuple[Any, int]:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("role") != "system_admin":
            return jsonify({"ok": False, "error": "Forbidden"}), 403
        return current_user

    def require_active_home_access(*, manage_devices: bool = False) -> dict[str, Any] | tuple[Any, int]:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("role") == "system_admin":
            return {"user": current_user, "home": None}

        home_id = request.args.get("homeId") or (request.get_json(silent=True) or {}).get("homeId")
        home = auth_store.get_home_access(str(current_user["id"]), str(home_id) if home_id else None)
        if home is None:
            return jsonify({"ok": False, "error": "Home access not found"}), 403
        if home["status"] != "active":
            return jsonify({"ok": False, "error": "Home is suspended"}), 403
        if manage_devices and (home.get("roleInHome") == "viewer" or not home["canManageDevices"]):
            return jsonify({"ok": False, "error": "Device permission denied"}), 403

        return {"user": current_user, "home": home}

    def require_home_member_manager(home_id: str) -> dict[str, Any] | tuple[Any, int]:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("role") == "system_admin":
            return {
                "user": current_user,
                "home": {
                    "id": home_id,
                    "status": "active",
                    "roleInHome": "owner",
                    "canManageMembers": True,
                },
            }

        home = auth_store.get_home_access(str(current_user["id"]), home_id)
        if home is None:
            return jsonify({"ok": False, "error": "Home access not found"}), 403
        if home["status"] != "active":
            return jsonify({"ok": False, "error": "Home is suspended"}), 403
        if home.get("roleInHome") != "owner":
            return jsonify({"ok": False, "error": "Only owner can manage quota and members"}), 403

        return {"user": current_user, "home": home}

    def require_home_device_manager(home_id: str) -> dict[str, Any] | tuple[Any, int]:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("role") == "system_admin":
            return {
                "user": current_user,
                "home": {
                    "id": home_id,
                    "status": "active",
                    "roleInHome": "owner",
                    "canManageDevices": True,
                },
            }

        home = auth_store.get_home_access(str(current_user["id"]), home_id)
        if home is None:
            return jsonify({"ok": False, "error": "Home access not found"}), 403
        if home["status"] != "active":
            return jsonify({"ok": False, "error": "Home is suspended"}), 403
        if not home.get("canManageDevices"):
            return jsonify({"ok": False, "error": "Device permission denied"}), 403

        return {"user": current_user, "home": home}

    def require_home_viewer(home_id: str) -> dict[str, Any] | tuple[Any, int]:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("role") == "system_admin":
            return {"user": current_user, "home": {"id": home_id, "status": "active"}}

        home = auth_store.get_home_access(str(current_user["id"]), home_id)
        if home is None:
            return jsonify({"ok": False, "error": "Home access not found"}), 403
        if home["status"] != "active":
            return jsonify({"ok": False, "error": "Home is suspended"}), 403

        return {"user": current_user, "home": home}

    def quota_control_guard(access: dict[str, Any]) -> dict[str, Any] | None:
        home = access.get("home")
        if not home:
            return None
        if access.get("user", {}).get("role") == "system_admin" or home.get("roleInHome") == "owner":
            return None

        quota = auth_store.get_home_quota_status(str(home["id"]))
        limit = float(quota.get("energyLimitKwh") or 0)
        current = float(quota.get("currentMonthEnergyKwh") or 0)
        if limit > 0 and current >= limit:
            return {
                "ok": False,
                "reason": "quota_exceeded",
                "error": "Đã vượt hạn mức HEMS. Tài khoản con không thể điều khiển thiết bị cho đến khi tài khoản cha tăng hạn mức.",
                "quota": quota,
            }
        return None

    def audit(
        action: str,
        *,
        actor: dict[str, Any] | None = None,
        target_type: str | None = None,
        target_id: str | None = None,
        target_name: str | None = None,
        home_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        try:
            auth_store.record_audit_log(
                actor=actor or get_current_user(),
                action=action,
                target_type=target_type,
                target_id=target_id,
                target_name=target_name,
                home_id=home_id,
                ip_address=request.headers.get("CF-Connecting-IP") or request.remote_addr,
                user_agent=request.headers.get("User-Agent"),
                metadata=metadata,
            )
        except Exception as exc:
            app.logger.warning("Could not write audit log: %s", exc)

    def plc_should_be_used() -> bool:
        return mode in {"plc-real", "auto"}

    def read_states_with_source() -> tuple[dict[str, bool], str, str | None]:
        if not plc_should_be_used():
            return state_store.load(), "mock", None

        try:
            return s7.read_device_states(devices), "plc-s7-1200", None
        except Exception as exc:
            if mode == "auto":
                return state_store.load(), "mock-fallback", str(exc)
            raise

    def read_states() -> dict[str, bool]:
        states, _source, _error = read_states_with_source()
        return states

    def read_power_measurement() -> dict[str, Any]:
        nonlocal mock_energy_kwh, last_mock_energy_update

        plc_error: str | None = None
        if plc_should_be_used():
            try:
                values = s7.read_power(config.get("powerTags", {}))
                source = "plc-s7-1200"
                effective_mode = "plc-real"
            except Exception as exc:
                if mode != "auto":
                    raise
                plc_error = str(exc)
                values = {}
                source = "mock-fallback"
                effective_mode = "mock"
        else:
            values = {}
            source = "mock"
            effective_mode = "mock"

        if source != "plc-s7-1200":
            states = state_store.load()
            active_power_w = sum(float(item["power"]) for item in devices if states.get(str(item["id"]), False))
            power_kw = round(active_power_w / 1000.0, 4)
            now = datetime.now(timezone.utc)
            with energy_lock:
                elapsed_hours = max(0.0, (now - last_mock_energy_update).total_seconds() / 3600.0)
                mock_energy_kwh = round(mock_energy_kwh + power_kw * elapsed_hours, 6)
                last_mock_energy_update = now
                energy_kwh = mock_energy_kwh
            values.update(
                {
                    "voltage": 220.0,
                    "current": round(active_power_w / 220.0, 4),
                    "power_kw": power_kw,
                    "energy_kwh": energy_kwh,
                }
            )

        warnings = list(values.get("_warnings", []))
        if plc_error:
            warnings.append(f"PLC not ready, using mock fallback: {plc_error}")

        return {
            "voltage": values.get("voltage"),
            "current": values.get("current"),
            "power_kw": values.get("power_kw"),
            "energy_kwh": values.get("energy_kwh"),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "mode": mode,
            "effectiveMode": effective_mode,
            "plcError": plc_error,
            "warnings": warnings,
        }

    def update_collector_status(**updates: Any) -> None:
        with collector_status_lock:
            collector_status.update(updates)

    def current_collector_status() -> dict[str, Any]:
        with collector_status_lock:
            return dict(collector_status)

    def run_power_collector_once() -> dict[str, Any]:
        homes = auth_store.list_collector_homes(collector_home_ids or None)
        if not homes:
            return {"ok": True, "readings": 0, "homeIds": []}

        reading = read_power_measurement()
        if mode == "auto" and reading.get("source") == "mock-fallback":
            return {
                "ok": True,
                "readings": 0,
                "homeIds": [home["id"] for home in homes],
                "warning": reading.get("plcError") or "PLC not ready",
            }
        saved_ids: list[str] = []
        for home in homes:
            saved = auth_store.record_power_reading(
                home_id=str(home["id"]),
                timestamp=str(reading["timestamp"]),
                voltage=optional_float(reading.get("voltage")),
                current=optional_float(reading.get("current")),
                power_kw=optional_float(reading.get("power_kw")),
                energy_kwh=optional_float(reading.get("energy_kwh")),
                source=f"{reading.get('source')}-collector",
                metadata={
                    "mode": mode,
                    "effectiveMode": reading.get("effectiveMode"),
                    "kind": "collector",
                    "intervalSeconds": collector_interval,
                },
            )
            saved_ids.append(saved["id"])
            auth_store.record_audit_log(
                actor={"id": "power-collector", "username": "power-collector", "role": "system"},
                action="power.collector_recorded",
                target_type="power_reading",
                target_id=saved["id"],
                home_id=str(home["id"]),
                metadata={"source": saved["source"], "power_kw": saved["power_kw"]},
            )
            check_and_execute_load_shedding(str(home["id"]))

        return {"ok": True, "readings": len(saved_ids), "homeIds": [home["id"] for home in homes], "readingIds": saved_ids}

    def power_collector_loop() -> None:
        update_collector_status(running=True, lastError=None)
        while not collector_stop_event.is_set():
            now_iso = datetime.now(timezone.utc).isoformat()
            update_collector_status(lastRunAt=now_iso)
            try:
                result = run_power_collector_once()
                readings_count = int(result.get("readings", 0))
                if result.get("warning"):
                    update_collector_status(lastError=str(result["warning"]), lastReadingCount=readings_count)
                    app.logger.warning("Power collector using fallback: %s", result["warning"])
                    continue
                with collector_status_lock:
                    collector_status["lastSuccessAt"] = datetime.now(timezone.utc).isoformat()
                    collector_status["lastError"] = None
                    collector_status["lastReadingCount"] = readings_count
                    collector_status["totalReadings"] = int(collector_status.get("totalReadings", 0)) + readings_count
            except Exception as exc:
                update_collector_status(lastError=str(exc))
                app.logger.warning("Power collector failed: %s", exc)

            if collector_stop_event.wait(collector_interval):
                break

        update_collector_status(running=False)

    def unpack_view_result(result: Any) -> tuple[dict[str, Any], int]:
        if isinstance(result, tuple):
            response, status = result
            return dict(response.get_json(silent=True) or {}), int(status)
        return dict(result.get_json(silent=True) or {}), 200

    def request_payload() -> dict[str, Any]:
        return dict(request.get_json(silent=True) or {})

    def requested_home_id() -> str | None:
        payload = request_payload()
        raw_home_id = request.args.get("homeId") or payload.get("homeId")
        return str(raw_home_id).strip() if raw_home_id else None

    def access_home_id(access: dict[str, Any]) -> str | None:
        home = access.get("home")
        if isinstance(home, dict) and home.get("id"):
            return str(home["id"])
        return requested_home_id()

    def optional_float(value: Any) -> float | None:
        if value is None or value == "":
            return None
        return float(value)

    def clean_optional_text(value: Any) -> str | None:
        text = str(value or "").strip()
        return text or None

    def parse_device_payload(payload: dict[str, Any], *, partial: bool = False) -> dict[str, Any] | tuple[dict[str, Any], tuple[Any, int]]:
        allowed_types = {"light", "fan", "aircon", "socket", "sensor", "appliance", "other"}
        allowed_status = {"on", "off", "offline", "unknown"}
        result: dict[str, Any] = {}

        if "name" in payload or not partial:
            name = str(payload.get("name") or "").strip()
            if not name:
                return result, (jsonify({"ok": False, "error": "name is required"}), 400)
            result["name"] = name

        if "roomId" in payload:
            result["roomId"] = clean_optional_text(payload.get("roomId"))

        if "type" in payload or not partial:
            device_type = str(payload.get("type") or "other").strip()
            if device_type not in allowed_types:
                return result, (jsonify({"ok": False, "error": "Invalid device type"}), 400)
            result["type"] = device_type

        if "status" in payload:
            status = str(payload.get("status") or "unknown").strip()
            if status not in allowed_status:
                return result, (jsonify({"ok": False, "error": "Invalid device status"}), 400)
            result["status"] = status

        if "ratedPowerW" in payload or "rated_power_w" in payload or not partial:
            raw_power = payload.get("ratedPowerW", payload.get("rated_power_w", 0))
            try:
                rated_power_w = float(raw_power or 0)
            except (TypeError, ValueError):
                return result, (jsonify({"ok": False, "error": "ratedPowerW must be a number"}), 400)
            if rated_power_w < 0:
                return result, (jsonify({"ok": False, "error": "ratedPowerW cannot be negative"}), 400)
            result["ratedPowerW"] = rated_power_w

        if "isControllable" in payload:
            result["isControllable"] = bool(payload.get("isControllable"))

        for source_key, target_key in {
            "plcStatusTag": "plcStatusTag",
            "plcOnCommandTag": "plcOnCommandTag",
            "plcOffCommandTag": "plcOffCommandTag",
        }.items():
            if source_key in payload:
                result[target_key] = clean_optional_text(payload.get(source_key))

        if "metadata" in payload:
            metadata = payload.get("metadata") or {}
            if not isinstance(metadata, dict):
                return result, (jsonify({"ok": False, "error": "metadata must be an object"}), 400)
            result["metadata"] = metadata

        return result

    def build_assistant_context(access: dict[str, Any]) -> dict[str, Any]:
        home = access.get("home") if isinstance(access.get("home"), dict) else None
        user = access.get("user") if isinstance(access.get("user"), dict) else {}
        home_id = access_home_id(access)

        context: dict[str, Any] = {
            "serverMode": mode,
            "home": {
                "id": home_id,
                "name": home.get("name") if home else None,
                "status": home.get("status") if home else None,
                "roleInHome": home.get("roleInHome") if home else None,
                "canManageDevices": home.get("canManageDevices") if home else None,
                "canManageMembers": home.get("canManageMembers") if home else None,
            },
            "user": {
                "role": user.get("role"),
                "roleInHome": home.get("roleInHome") if home else None,
            },
            "power": None,
            "quota": None,
            "devices": [],
        }

        try:
            context["power"] = read_power_measurement()
        except Exception as exc:
                context["power"] = {"error": str(exc), "source": mode}

        if home_id:
            try:
                context["quota"] = auth_store.get_home_quota_status(home_id)
            except Exception as exc:
                context["quota"] = {"error": str(exc)}

        try:
            states = read_states()
        except Exception as exc:
            states = state_store.load()
            context["deviceStateError"] = str(exc)

        context["devices"] = [
            {
                "id": str(item.get("id")),
                "name": item.get("name"),
                "roomId": item.get("roomId"),
                "type": item.get("type"),
                "ratedPowerW": item.get("power"),
                "isOn": bool(states.get(str(item.get("id")), False)),
            }
            for item in devices
        ]
        return context

    def record_power_snapshot(access: dict[str, Any], reading: dict[str, Any]) -> dict[str, Any] | None:
        home_id = access_home_id(access)
        if not home_id:
            return None
        if mode == "auto" and reading.get("source") == "mock-fallback":
            return None

        saved = auth_store.record_power_reading(
            home_id=home_id,
            timestamp=str(reading["timestamp"]),
            voltage=optional_float(reading.get("voltage")),
            current=optional_float(reading.get("current")),
            power_kw=optional_float(reading.get("power_kw")),
            energy_kwh=optional_float(reading.get("energy_kwh")),
            source=str(reading.get("source") or "unknown"),
            metadata={"mode": mode, "effectiveMode": reading.get("effectiveMode"), "kind": "snapshot"},
        )
        audit(
            "power.reading_recorded",
            actor=access.get("user"),
            target_type="power_reading",
            target_id=saved["id"],
            home_id=home_id,
            metadata={"source": saved["source"], "power_kw": saved["power_kw"]},
        )
        if saved:
            check_and_execute_load_shedding(home_id)
        return saved

    def check_and_execute_load_shedding(home_id: str) -> None:
        if not auto_load_shedding_enabled:
            return
        try:
            quota = auth_store.get_home_quota_status(home_id)
            limit = float(quota.get("energyLimitKwh") or 0)
            current = float(quota.get("currentMonthEnergyKwh") or 0)

            if limit > 0 and current >= limit:
                states, source, plc_error = read_states_with_source()
                active_devices = []

                # Check config devices
                for d in devices:
                    d_id = str(d["id"])
                    if home_id == "home-demo-001" and states.get(d_id, False):
                        active_devices.append(d)

                # Check DB manual devices
                try:
                    db_devices = auth_store.list_manual_devices(home_id)
                    for d in db_devices:
                        d_id = str(d["id"])
                        if states.get(d_id, False):
                            active_devices.append({
                                "id": d_id,
                                "name": d.get("name", d_id),
                                "type": d.get("type", "other"),
                                "power": float(d.get("ratedPowerW") or 0),
                                "statusTag": d.get("plcStatusTag"),
                                "source": "manual"
                            })
                except Exception as db_exc:
                    app.logger.warning("Load-shedding failed to fetch DB devices: %s", db_exc)

                # Deduplicate
                unique_devices = {}
                for dev in active_devices:
                    unique_devices[str(dev["id"])] = dev

                to_shed = list(unique_devices.values())

                def get_shedding_priority(dev):
                    t = str(dev.get("type") or "").lower()
                    power = float(dev.get("power") or 0)
                    type_score = 1
                    if t == "ac":
                        type_score = 5
                    elif t == "outlet":
                        type_score = 4
                    elif t == "fan":
                        type_score = 3
                    elif t == "light":
                        type_score = 2
                    return (type_score, power)

                to_shed.sort(key=get_shedding_priority, reverse=True)

                if to_shed:
                    app.logger.info("HEMS Hạn mức: Nhà %s vượt quota (%s/%s kWh). Đang tự động cắt tải.", home_id, current, limit)
                    for dev in to_shed:
                        dev_id = str(dev["id"])
                        dev_name = str(dev.get("name") or dev_id)
                        try:
                            if plc_should_be_used() and dev.get("statusTag"):
                                s7.write_device_command(dev, False)
                            state_store.set_state(dev_id, False)
                            audit(
                                "device.auto_shed_load",
                                actor={"id": "hems-auto", "username": "HEMS Auto-Shedding", "role": "system"},
                                target_type="device",
                                target_id=dev_id,
                                target_name=dev_name,
                                home_id=home_id,
                                metadata={
                                    "reason": "energy_limit_exceeded",
                                    "currentMonthEnergyKwh": current,
                                    "energyLimitKwh": limit,
                                    "deviceType": dev.get("type"),
                                    "devicePowerW": dev.get("power")
                                }
                            )
                            app.logger.info("HEMS Hạn mức: Tự động tắt '%s' (%s) thành công.", dev_name, dev_id)
                        except Exception as dev_exc:
                            app.logger.error("HEMS Hạn mức: Lỗi tự động tắt '%s': %s", dev_id, dev_exc)
        except Exception as exc:
            app.logger.error("HEMS Hạn mức: Lỗi phân tích cắt tải cho nhà %s: %s", home_id, exc)

    @app.get("/health")
    def health() -> Any:
        return jsonify(
            {
                "ok": True,
                "service": "smart-home-server",
                "mode": mode,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    @app.get("/api/auth/check")
    def auth_check() -> Any:
        current_user = get_current_user()
        return jsonify({"ok": True, "service": "smart-home-server", "auth": "ok", "user": current_user})

    @app.get("/api/system/status")
    def system_status() -> Any:
        current_user = get_current_user()
        collector_snapshot = current_collector_status()
        if mode == "mock":
            effective_mode = "mock"
            power_source = "mock"
        elif collector_snapshot.get("lastSuccessAt") and not collector_snapshot.get("lastError"):
            effective_mode = "plc-real"
            power_source = "plc-s7-1200"
        elif mode == "auto":
            effective_mode = "mock"
            power_source = "mock-fallback"
        else:
            effective_mode = "plc-real"
            power_source = "plc-s7-1200"
        plc = config.get("plc", {})
        assistant = assistant_config(config)

        return jsonify(
            {
                "ok": True,
                "service": "smart-home-server",
                "mode": mode,
                "effectiveMode": effective_mode,
                "powerSource": power_source,
                "plcConfigured": plc_should_be_used(),
                "plcHost": plc.get("host"),
                "plcRack": plc.get("rack", 0),
                "plcSlot": plc.get("slot", 1),
                "database": {
                    "kind": database_kind,
                    "label": database_label,
                },
                "databasePath": database_label,
                "statePath": str(STATE_PATH.resolve()),
                "serverTime": datetime.now(timezone.utc).isoformat(),
                "authUser": current_user,
                "powerCollector": collector_snapshot,
                "assistant": {
                    "provider": assistant["provider"],
                    "model": assistant["model"],
                    "sendHomeContext": assistant["sendHomeContext"],
                    "localLoraUrl": assistant["localLoraUrl"] if assistant["provider"] == "local_lora" else None,
                },
            }
        )

    @app.get("/api/power/collector/status")
    def power_collector_status() -> Any:
        return jsonify({"ok": True, "collector": current_collector_status()})

    @app.post("/api/power/collector/run-once")
    def power_collector_run_once() -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        try:
            result = run_power_collector_once()
            update_collector_status(
                lastRunAt=datetime.now(timezone.utc).isoformat(),
                lastSuccessAt=datetime.now(timezone.utc).isoformat(),
                lastError=None,
                lastReadingCount=int(result.get("readings", 0)),
                totalReadings=int(current_collector_status().get("totalReadings", 0)) + int(result.get("readings", 0)),
            )
            audit(
                "power.collector_run_once",
                actor=admin,
                target_type="power_collector",
                metadata={"readings": result.get("readings"), "homeIds": result.get("homeIds", [])},
            )
            return jsonify(result)
        except Exception as exc:
            update_collector_status(lastError=str(exc))
            return jsonify({"ok": False, "error": str(exc)}), 500

    @app.post("/api/auth/login")
    def login() -> Any:
        payload = request.get_json(silent=True) or {}
        username = str(payload.get("username") or payload.get("phone") or "").strip()
        password = str(payload.get("password") or "")

        if not username or not password:
            return jsonify({"ok": False, "error": "Username/phone and password are required"}), 400

        session = auth_store.login(username, password)
        if not session:
            audit(
                "auth.login_failed",
                actor={"id": None, "username": username, "role": "anonymous"},
                target_type="user",
                target_name=username,
                metadata={"reason": "invalid_credentials"},
            )
            return jsonify({"ok": False, "error": "Sai tài khoản hoặc mật khẩu"}), 401

        audit(
            "auth.login_success",
            actor=session["user"],
            target_type="user",
            target_id=session["user"]["id"],
            target_name=session["user"]["username"],
            home_id=session["homes"][0]["id"] if session.get("homes") else None,
            metadata={"homeIds": [home["id"] for home in session.get("homes", [])]},
        )
        return jsonify({"ok": True, **session})

    @app.get("/api/me")
    def me() -> Any:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user["id"] == "api-token":
            return jsonify({"ok": True, "user": current_user, "homes": []})

        profile = auth_store.get_me(str(current_user["id"]))
        if not profile:
            return jsonify({"ok": False, "error": "User not found"}), 404
        return jsonify({"ok": True, **profile})

    @app.patch("/api/auth/change-password")
    def change_own_password() -> Any:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401
        if current_user.get("id") == "api-token":
            return jsonify({"ok": False, "error": "API token cannot change password"}), 400

        payload = request.get_json(silent=True) or {}
        current_password = str(payload.get("currentPassword") or "")
        new_password = str(payload.get("newPassword") or payload.get("password") or "")
        if not current_password or not new_password:
            return jsonify({"ok": False, "error": "currentPassword and newPassword are required"}), 400
        if len(new_password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

        try:
            user = auth_store.change_user_password(
                str(current_user["id"]),
                current_password,
                new_password,
                keep_token=extract_token(),
            )
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400

        if user is None:
            return jsonify({"ok": False, "error": "User not found"}), 404

        audit(
            "auth.change_password",
            actor=current_user,
            target_type="user",
            target_id=str(current_user["id"]),
            target_name=str(current_user.get("username") or current_user.get("name") or ""),
        )
        return jsonify({"ok": True, "user": user})

    @app.get("/api/homes/<home_id>/quota")
    def home_quota(home_id: str) -> Any:
        current_user = get_current_user()
        if not current_user:
            return jsonify({"ok": False, "error": "Unauthorized"}), 401

        if current_user.get("role") == "system_admin":
            quota = auth_store.get_home_quota_status(home_id)
            return jsonify({"ok": True, "quota": quota})

        home = auth_store.get_home_access(str(current_user["id"]), home_id)
        if home is None:
            return jsonify({"ok": False, "error": "Home access not found"}), 403
        if home["status"] != "active":
            return jsonify({"ok": False, "error": "Home is suspended"}), 403

        quota = auth_store.get_home_quota_status(home_id)
        audit("home.view_quota", actor=current_user, target_type="home", target_id=home_id, home_id=home_id)
        return jsonify({"ok": True, "quota": quota})

    @app.post("/api/homes/<home_id>/quota")
    def update_home_quota(home_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        payload = request.get_json(silent=True) or {}
        limit_val = payload.get("energyLimitKwh")
        if limit_val is None:
            return jsonify({"ok": False, "error": "energyLimitKwh is required"}), 400

        try:
            limit = float(limit_val)
            if limit < 0:
                return jsonify({"ok": False, "error": "energyLimitKwh cannot be negative"}), 400
        except ValueError:
            return jsonify({"ok": False, "error": "energyLimitKwh must be a number"}), 400

        old_quota = auth_store.get_home_quota_status(home_id)
        if not auth_store.update_home_quota(home_id, limit):
            return jsonify({"ok": False, "error": "Home not found"}), 404
        new_quota = auth_store.get_home_quota_status(home_id)

        audit(
            "home.quota_updated",
            actor=access["user"],
            target_type="home",
            target_id=home_id,
            home_id=home_id,
            metadata={"oldLimit": old_quota.get("energyLimitKwh"), "newLimit": limit},
        )
        return jsonify({"ok": True, "quota": new_quota})

    @app.get("/api/homes/<home_id>/members")
    def home_members(home_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        audit("home.view_members", actor=access["user"], target_type="home", target_id=home_id, home_id=home_id)
        return jsonify({"ok": True, "members": auth_store.list_home_members(home_id)})

    @app.get("/api/homes/<home_id>/activity")
    def home_activity(home_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        try:
            limit = int(request.args.get("limit", 100))
        except ValueError:
            limit = 100
        safe_limit = min(max(limit, 1), 300)

        logs = auth_store.list_home_audit_logs(home_id, safe_limit)
        audit(
            "home.view_activity",
            actor=access["user"],
            target_type="home",
            target_id=home_id,
            home_id=home_id,
            metadata={"limit": safe_limit},
        )
        return jsonify({"ok": True, "logs": logs})

    @app.get("/api/homes/<home_id>/rooms")
    def list_home_rooms(home_id: str) -> Any:
        access = require_home_viewer(home_id)
        if not isinstance(access, dict):
            return access

        return jsonify({"ok": True, "rooms": auth_store.list_rooms(home_id)})

    @app.post("/api/homes/<home_id>/rooms")
    def create_home_room(home_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        payload = request_payload()
        name = str(payload.get("name") or "").strip()
        if not name:
            return jsonify({"ok": False, "error": "name is required"}), 400

        metadata = payload.get("metadata") or {}
        if not isinstance(metadata, dict):
            return jsonify({"ok": False, "error": "metadata must be an object"}), 400

        try:
            room = auth_store.create_room(
                home_id=home_id,
                name=name,
                room_type=str(payload.get("type") or "room").strip() or "room",
                sort_order=int(payload.get("sortOrder") or 0),
                metadata=metadata,
            )
        except Exception as exc:
            message = str(exc)
            if "duplicate" in message.lower() or "unique" in message.lower():
                return jsonify({"ok": False, "error": "Room name already exists"}), 409
            return jsonify({"ok": False, "error": message}), 400

        if room is None:
            return jsonify({"ok": False, "error": "Home not found"}), 404

        audit(
            "room.created",
            actor=access["user"],
            target_type="room",
            target_id=room["id"],
            target_name=room["name"],
            home_id=home_id,
        )
        return jsonify({"ok": True, "room": room}), 201

    @app.patch("/api/homes/<home_id>/rooms/<room_id>")
    def update_home_room(home_id: str, room_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        payload = request_payload()
        updates: dict[str, Any] = {}
        if "name" in payload:
            name = str(payload.get("name") or "").strip()
            if not name:
                return jsonify({"ok": False, "error": "name cannot be empty"}), 400
            updates["name"] = name
        if "type" in payload:
            updates["type"] = str(payload.get("type") or "room").strip() or "room"
        if "sortOrder" in payload:
            try:
                updates["sortOrder"] = int(payload.get("sortOrder") or 0)
            except (TypeError, ValueError):
                return jsonify({"ok": False, "error": "sortOrder must be an integer"}), 400
        if "metadata" in payload:
            metadata = payload.get("metadata") or {}
            if not isinstance(metadata, dict):
                return jsonify({"ok": False, "error": "metadata must be an object"}), 400
            updates["metadata"] = metadata

        try:
            room = auth_store.update_room(home_id=home_id, room_id=room_id, updates=updates)
        except Exception as exc:
            message = str(exc)
            if "duplicate" in message.lower() or "unique" in message.lower():
                return jsonify({"ok": False, "error": "Room name already exists"}), 409
            return jsonify({"ok": False, "error": message}), 400

        if room is None:
            return jsonify({"ok": False, "error": "Room not found"}), 404

        audit(
            "room.updated",
            actor=access["user"],
            target_type="room",
            target_id=room["id"],
            target_name=room["name"],
            home_id=home_id,
            metadata={"fields": list(updates.keys())},
        )
        return jsonify({"ok": True, "room": room})

    @app.delete("/api/homes/<home_id>/rooms/<room_id>")
    def delete_home_room(home_id: str, room_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        room = auth_store.delete_room(home_id, room_id)
        if room is None:
            return jsonify({"ok": False, "error": "Room not found"}), 404

        audit(
            "room.deleted",
            actor=access["user"],
            target_type="room",
            target_id=room["id"],
            target_name=room["name"],
            home_id=home_id,
        )
        return jsonify({"ok": True, "room": room})

    @app.get("/api/homes/<home_id>/devices")
    def list_home_manual_devices(home_id: str) -> Any:
        access = require_home_viewer(home_id)
        if not isinstance(access, dict):
            return access

        room_id = clean_optional_text(request.args.get("roomId"))
        return jsonify({"ok": True, "devices": auth_store.list_manual_devices(home_id, room_id)})

    @app.post("/api/homes/<home_id>/devices")
    def create_home_manual_device(home_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        parsed = parse_device_payload(request_payload())
        if isinstance(parsed, tuple):
            return parsed[1]

        try:
            device = auth_store.create_manual_device(
                home_id=home_id,
                room_id=parsed.get("roomId"),
                name=parsed["name"],
                device_type=parsed["type"],
                status=parsed.get("status", "unknown"),
                rated_power_w=float(parsed.get("ratedPowerW") or 0),
                is_controllable=bool(parsed.get("isControllable", True)),
                plc_status_tag=parsed.get("plcStatusTag"),
                plc_on_command_tag=parsed.get("plcOnCommandTag"),
                plc_off_command_tag=parsed.get("plcOffCommandTag"),
                metadata=parsed.get("metadata") or {},
            )
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400
        except Exception as exc:
            message = str(exc)
            if "duplicate" in message.lower() or "unique" in message.lower():
                return jsonify({"ok": False, "error": "Device name already exists"}), 409
            return jsonify({"ok": False, "error": message}), 400

        if device is None:
            return jsonify({"ok": False, "error": "Home not found"}), 404

        event = auth_store.record_device_event(
            home_id=home_id,
            room_id=device.get("roomId"),
            device_id=device["id"],
            actor_user_id=str(access["user"].get("id")) if access.get("user") else None,
            event_type="created",
            value={"deviceName": device["name"], "type": device["type"], "ratedPowerW": device["ratedPowerW"]},
        )
        audit(
            "device.inventory_created",
            actor=access["user"],
            target_type="device",
            target_id=device["id"],
            target_name=device["name"],
            home_id=home_id,
            metadata={"eventId": event["id"], "type": device["type"]},
        )
        return jsonify({"ok": True, "device": device, "event": event}), 201

    @app.patch("/api/homes/<home_id>/devices/<device_id>")
    def update_home_manual_device(home_id: str, device_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        parsed = parse_device_payload(request_payload(), partial=True)
        if isinstance(parsed, tuple):
            return parsed[1]

        try:
            device = auth_store.update_manual_device(home_id=home_id, device_id=device_id, updates=parsed)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400
        except Exception as exc:
            message = str(exc)
            if "duplicate" in message.lower() or "unique" in message.lower():
                return jsonify({"ok": False, "error": "Device name already exists"}), 409
            return jsonify({"ok": False, "error": message}), 400

        if device is None:
            return jsonify({"ok": False, "error": "Device not found"}), 404

        event = auth_store.record_device_event(
            home_id=home_id,
            room_id=device.get("roomId"),
            device_id=device["id"],
            actor_user_id=str(access["user"].get("id")) if access.get("user") else None,
            event_type="updated",
            value={"fields": list(parsed.keys())},
        )
        audit(
            "device.inventory_updated",
            actor=access["user"],
            target_type="device",
            target_id=device["id"],
            target_name=device["name"],
            home_id=home_id,
            metadata={"eventId": event["id"], "fields": list(parsed.keys())},
        )
        return jsonify({"ok": True, "device": device, "event": event})

    @app.delete("/api/homes/<home_id>/devices/<device_id>")
    def delete_home_manual_device(home_id: str, device_id: str) -> Any:
        access = require_home_device_manager(home_id)
        if not isinstance(access, dict):
            return access

        device = auth_store.delete_manual_device(home_id, device_id)
        if device is None:
            return jsonify({"ok": False, "error": "Device not found"}), 404

        event = auth_store.record_device_event(
            home_id=home_id,
            room_id=device.get("roomId"),
            device_id=None,
            actor_user_id=str(access["user"].get("id")) if access.get("user") else None,
            event_type="deleted",
            value={"deviceId": device["id"], "deviceName": device["name"], "type": device["type"]},
        )
        audit(
            "device.inventory_deleted",
            actor=access["user"],
            target_type="device",
            target_id=device["id"],
            target_name=device["name"],
            home_id=home_id,
            metadata={"eventId": event["id"]},
        )
        return jsonify({"ok": True, "device": device, "event": event})

    @app.post("/api/homes/<home_id>/members")
    def create_home_member(home_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        payload = request.get_json(silent=True) or {}
        name = str(payload.get("name") or "").strip()
        username = str(payload.get("username") or "").strip()
        phone = str(payload.get("phone") or "").strip() or None
        password = str(payload.get("password") or "")
        role_in_home = str(payload.get("roleInHome") or "member").strip()
        can_manage_members = bool(payload.get("canManageMembers", False))
        can_manage_devices = bool(payload.get("canManageDevices", role_in_home == "member"))

        if role_in_home not in {"member", "viewer"}:
            return jsonify({"ok": False, "error": "roleInHome must be member or viewer"}), 400
        if role_in_home == "viewer":
            can_manage_members = False
            can_manage_devices = False
        if not name or not username or not password:
            return jsonify({"ok": False, "error": "name, username and password are required"}), 400
        if len(password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

        try:
            member = auth_store.create_home_member(
                home_id=home_id,
                name=name,
                username=username,
                phone=phone,
                password=password,
                role_in_home=role_in_home,
                can_manage_members=can_manage_members,
                can_manage_devices=can_manage_devices,
            )
        except Exception as exc:
            message = str(exc)
            if "UNIQUE constraint failed" in message:
                return jsonify({"ok": False, "error": "Username or phone already exists"}), 409
            return jsonify({"ok": False, "error": message}), 500

        if member is None:
            return jsonify({"ok": False, "error": "Home not found"}), 404

        audit(
            "home.create_member",
            actor=access["user"],
            target_type="user",
            target_id=member["id"],
            target_name=member["username"],
            home_id=home_id,
            metadata={"roleInHome": role_in_home},
        )
        return jsonify({"ok": True, "member": member}), 201

    @app.patch("/api/homes/<home_id>/members/<user_id>/suspend")
    def suspend_home_member(home_id: str, user_id: str) -> Any:
        return update_home_member_status(home_id, user_id, "suspended")

    @app.patch("/api/homes/<home_id>/members/<user_id>/activate")
    def activate_home_member(home_id: str, user_id: str) -> Any:
        return update_home_member_status(home_id, user_id, "active")

    @app.patch("/api/homes/<home_id>/members/<user_id>/reset-password")
    def reset_home_member_password(home_id: str, user_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        payload = request.get_json(silent=True) or {}
        new_password = str(payload.get("password") or "")
        if len(new_password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

        member = next((item for item in auth_store.list_home_members(home_id) if str(item["id"]) == user_id), None)
        if member is None:
            return jsonify({"ok": False, "error": "Member not found"}), 404
        if member.get("roleInHome") == "owner":
            return jsonify({"ok": False, "error": "Cannot reset owner password from member management"}), 400

        try:
            user = auth_store.reset_user_password(user_id, new_password)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400
        if user is None:
            return jsonify({"ok": False, "error": "User not found"}), 404

        audit(
            "home.reset_member_password",
            actor=access["user"],
            target_type="user",
            target_id=user["id"],
            target_name=user["username"],
            home_id=home_id,
        )
        return jsonify({"ok": True, "user": user})

    def update_home_member_status(home_id: str, user_id: str, status: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        try:
            member = auth_store.set_home_member_status(home_id, user_id, status)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400
        if member is None:
            return jsonify({"ok": False, "error": "Member not found"}), 404

        audit(
            "home.suspend_member" if status == "suspended" else "home.activate_member",
            actor=access["user"],
            target_type="user",
            target_id=member["id"],
            target_name=member["username"],
            home_id=home_id,
            metadata={"status": status},
        )
        return jsonify({"ok": True, "member": member})

    @app.delete("/api/homes/<home_id>/members/<user_id>")
    def delete_home_member(home_id: str, user_id: str) -> Any:
        access = require_home_member_manager(home_id)
        if not isinstance(access, dict):
            return access

        try:
            member = auth_store.remove_home_member(home_id, user_id)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400
        if member is None:
            return jsonify({"ok": False, "error": "Member not found"}), 404

        audit(
            "home.delete_member",
            actor=access["user"],
            target_type="user",
            target_id=member["id"],
            target_name=member["username"],
            home_id=home_id,
        )
        return jsonify({"ok": True, "member": member})

    @app.get("/api/admin/homes")
    def admin_homes() -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin
        audit("admin.view_homes", actor=admin, target_type="homes")
        return jsonify({"ok": True, "homes": auth_store.list_admin_homes()})

    @app.get("/api/admin/users")
    def admin_users() -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin
        audit("admin.view_users", actor=admin, target_type="users")
        return jsonify({"ok": True, "users": auth_store.list_admin_users()})

    @app.get("/api/admin/audit-logs")
    def admin_audit_logs() -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        limit = request.args.get("limit", "100")
        try:
            safe_limit = int(limit)
        except ValueError:
            safe_limit = 100

        audit("admin.view_audit_logs", actor=admin, target_type="audit_logs", metadata={"limit": safe_limit})
        return jsonify({"ok": True, "logs": auth_store.list_audit_logs(safe_limit)})

    @app.post("/api/admin/owners")
    def admin_create_owner() -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        payload = request.get_json(silent=True) or {}
        owner_name = str(payload.get("ownerName") or payload.get("name") or "").strip()
        username = str(payload.get("username") or "").strip()
        phone = str(payload.get("phone") or "").strip() or None
        password = str(payload.get("password") or "")
        home_name = str(payload.get("homeName") or "").strip()

        if not owner_name or not username or not password or not home_name:
            return jsonify({"ok": False, "error": "ownerName, username, password and homeName are required"}), 400
        if len(password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

        try:
            result = auth_store.create_owner_with_home(
                owner_name=owner_name,
                username=username,
                phone=phone,
                password=password,
                home_name=home_name,
            )
        except Exception as exc:
            message = str(exc)
            if "UNIQUE constraint failed" in message:
                return jsonify({"ok": False, "error": "Username or phone already exists"}), 409
            return jsonify({"ok": False, "error": message}), 500

        audit(
            "admin.create_owner_home",
            actor=admin,
            target_type="home",
            target_id=result["home"]["id"],
            target_name=result["home"]["name"],
            home_id=result["home"]["id"],
            metadata={"ownerId": result["user"]["id"], "ownerUsername": result["user"]["username"]},
        )
        return jsonify({"ok": True, **result}), 201

    @app.patch("/api/admin/users/<user_id>/suspend")
    def admin_suspend_user(user_id: str) -> Any:
        return update_admin_user_status(user_id, "suspended")

    @app.patch("/api/admin/users/<user_id>/activate")
    def admin_activate_user(user_id: str) -> Any:
        return update_admin_user_status(user_id, "active")

    def update_admin_user_status(user_id: str, status: str) -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        try:
            user = auth_store.set_user_status(user_id, status)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400

        if user is None:
            return jsonify({"ok": False, "error": "User not found"}), 404

        audit(
            "admin.suspend_user" if status == "suspended" else "admin.activate_user",
            actor=admin,
            target_type="user",
            target_id=user["id"],
            target_name=user["username"],
            metadata={"status": status},
        )
        return jsonify({"ok": True, "user": user})

    @app.patch("/api/admin/users/<user_id>/reset-password")
    def admin_reset_user_password(user_id: str) -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        payload = request.get_json(silent=True) or {}
        new_password = str(payload.get("password") or "")
        if len(new_password) < 6:
            return jsonify({"ok": False, "error": "Password must be at least 6 characters"}), 400

        try:
            user = auth_store.reset_user_password(user_id, new_password)
        except ValueError as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400

        if user is None:
            return jsonify({"ok": False, "error": "User not found"}), 404

        audit(
            "admin.reset_user_password",
            actor=admin,
            target_type="user",
            target_id=user["id"],
            target_name=user["username"],
        )
        return jsonify({"ok": True, "user": user})

    @app.patch("/api/admin/homes/<home_id>/suspend")
    def admin_suspend_home(home_id: str) -> Any:
        return update_admin_home_status(home_id, "suspended")

    @app.patch("/api/admin/homes/<home_id>/activate")
    def admin_activate_home(home_id: str) -> Any:
        return update_admin_home_status(home_id, "active")

    def update_admin_home_status(home_id: str, status: str) -> Any:
        admin = require_system_admin()
        if not isinstance(admin, dict):
            return admin

        home = auth_store.set_home_status(home_id, status)
        if home is None:
            return jsonify({"ok": False, "error": "Home not found"}), 404

        audit(
            "admin.suspend_home" if status == "suspended" else "admin.activate_home",
            actor=admin,
            target_type="home",
            target_id=home["id"],
            target_name=home["name"],
            home_id=home["id"],
            metadata={"status": status},
        )
        return jsonify({"ok": True, "home": home})

    @app.get("/api/power/current")
    def power_current() -> Any:
        access = require_active_home_access()
        if not isinstance(access, dict):
            return access

        try:
            reading = read_power_measurement()
            # GET must remain read-only. The background collector owns persistence.
            return jsonify({**reading, "recorded": False, "readingId": None})
        except Exception as exc:
            return jsonify({"ok": False, "error": str(exc)}), 500

    @app.post("/api/power/readings")
    def create_power_reading() -> Any:
        payload = request_payload()
        home_id = str(payload.get("homeId") or "").strip()
        if not home_id:
            return jsonify({"ok": False, "error": "homeId is required"}), 400
        if telemetry_allowed_home_ids and home_id not in telemetry_allowed_home_ids:
            return jsonify({"ok": False, "error": "Telemetry service is not authorized for this home"}), 403
        if not auth_store.list_collector_homes([home_id]):
            return jsonify({"ok": False, "error": "Active home not found"}), 404

        try:
            timestamp = str(payload.get("timestamp") or datetime.now(timezone.utc).isoformat())
            saved = auth_store.record_power_reading(
                home_id=home_id,
                timestamp=timestamp,
                voltage=optional_float(payload.get("voltage")),
                current=optional_float(payload.get("current")),
                power_kw=optional_float(payload.get("power_kw")),
                energy_kwh=optional_float(payload.get("energy_kwh")),
                source=str(payload.get("source") or "api"),
                metadata=dict(payload.get("metadata") or {}),
            )
            audit(
                "power.reading_created",
                actor={"id": "telemetry-service", "username": "telemetry-service", "role": "service"},
                target_type="power_reading",
                target_id=saved["id"],
                home_id=home_id,
                metadata={"source": saved["source"], "power_kw": saved["power_kw"]},
            )
            if saved:
                check_and_execute_load_shedding(home_id)
            return jsonify({"ok": True, "reading": saved}), 201
        except Exception as exc:
            return jsonify({"ok": False, "error": str(exc)}), 400

    @app.get("/api/power/history")
    def power_history() -> Any:
        access = require_active_home_access()
        if not isinstance(access, dict):
            return access

        home_id = access_home_id(access)
        if not home_id:
            return jsonify({"ok": False, "error": "homeId is required"}), 400

        try:
            resolution = request.args.get("resolution", "").strip().lower()
            if resolution == "hourly":
                limit = int(request.args.get("limit", "1000"))
                readings = auth_store.list_power_readings_hourly(
                    home_id=home_id,
                    limit=limit
                )
            else:
                limit = int(request.args.get("limit", "288"))
                readings = auth_store.list_power_readings(
                    home_id=home_id,
                    limit=limit,
                    start=request.args.get("start"),
                    end=request.args.get("end"),
                )
            return jsonify({"ok": True, "homeId": home_id, "readings": readings})
        except Exception as exc:
            return jsonify({"ok": False, "error": str(exc)}), 500


    @app.get("/api/devices")
    def get_devices() -> Any:
        access = require_active_home_access()
        if not isinstance(access, dict):
            return access

        try:
            states, source, plc_error = read_states_with_source()
            return jsonify(
                {
                    "devices": group_devices(devices, states),
                    "mode": mode,
                    "effectiveMode": "plc-real" if source == "plc-s7-1200" else "mock",
                    "source": source,
                    "plcError": plc_error,
                }
            )
        except Exception as exc:
            return jsonify({"ok": False, "error": str(exc)}), 500

    @app.post("/api/devices/<device_id>/turn-on")
    def turn_on(device_id: str) -> Any:
        return set_device(device_id, True)

    @app.post("/api/devices/<device_id>/turn-off")
    def turn_off(device_id: str) -> Any:
        return set_device(device_id, False)

    def set_device(device_id: str, is_on: bool) -> Any:
        access = require_active_home_access(manage_devices=True)
        if not isinstance(access, dict):
            return access

        device = next((item for item in devices if str(item["id"]) == device_id), None)
        if not device:
            return jsonify({"ok": False, "error": f"Unknown device: {device_id}"}), 404

        result = execute_device_command(access, device, is_on)
        if not result["ok"]:
            status = 403 if result.get("reason") == "quota_exceeded" else 500
            return jsonify(result), status
        return jsonify(result)

    def execute_device_command(access: dict[str, Any], device: dict[str, Any], is_on: bool) -> dict[str, Any]:
        device_id = str(device["id"])
        quota_block = quota_control_guard(access)
        if quota_block:
            audit(
                "device.control_blocked_quota",
                actor=access.get("user"),
                target_type="device",
                target_id=device_id,
                target_name=str(device.get("name", device_id)),
                home_id=access["home"]["id"] if access.get("home") else None,
                metadata={
                    "requestedState": is_on,
                    "roomId": device.get("roomId"),
                    "quota": quota_block.get("quota"),
                },
            )
            return {**quota_block, "device_id": device_id, "isOn": is_on}

        try:
            feedback: dict[str, Any] | None = None
            if plc_should_be_used():
                feedback = s7.write_device_command(device, is_on)

            state_store.set_state(device_id, is_on)
            audit(
                "device.turn_on" if is_on else "device.turn_off",
                actor=access.get("user"),
                target_type="device",
                target_id=device_id,
                target_name=str(device.get("name", device_id)),
                home_id=access["home"]["id"] if access.get("home") else None,
                metadata={"roomId": device.get("roomId"), "mode": mode, "isOn": is_on, "feedback": feedback},
            )
            return {"ok": True, "device_id": device_id, "isOn": is_on, "feedback": feedback}
        except Exception as exc:
            return {"ok": False, "error": str(exc), "device_id": device_id, "isOn": is_on, "mode": mode}

    @app.post("/api/scenes/<scene>")
    def apply_scene(scene: str) -> Any:
        access = require_active_home_access(manage_devices=True)
        if not isinstance(access, dict):
            return access

        result = execute_scene(access, scene)
        if not result["ok"]:
            if result.get("reason") == "unknown_scene":
                status = 400
            elif result.get("reason") == "quota_exceeded":
                status = 403
            else:
                status = 500
            return jsonify(result), status
        return jsonify(result)

    def execute_scene(access: dict[str, Any], scene: str) -> dict[str, Any]:
        scene = str(scene)
        quota_block = quota_control_guard(access)
        if quota_block:
            audit(
                "scene.blocked_quota",
                actor=access.get("user"),
                target_type="scene",
                target_id=scene,
                target_name=scene,
                home_id=access["home"]["id"] if access.get("home") else None,
                metadata={"quota": quota_block.get("quota")},
            )
            return {**quota_block, "scene": scene}

        states = state_store.load()

        if scene == "sleep":
            target = {str(item["id"]): False for item in devices if item["type"] in {"light", "fan"}}
        elif scene == "work":
            target = {str(item["id"]): False for item in devices}
        elif scene in {"morning", "weekend"}:
            target = {str(item["id"]): True for item in devices}
        else:
            return {"ok": False, "error": f"Unknown scene: {scene}", "reason": "unknown_scene", "scene": scene}

        try:
            for device_id, is_on in target.items():
                device = next(item for item in devices if str(item["id"]) == device_id)
                if plc_should_be_used():
                    s7.write_device_command(device, is_on)
                states[device_id] = is_on

            state_store.save(states)
            audit(
                "scene.apply",
                actor=access.get("user"),
                target_type="scene",
                target_id=scene,
                target_name=scene,
                home_id=access["home"]["id"] if access.get("home") else None,
                metadata={"affected": len(target), "mode": mode},
            )
            return {"ok": True, "scene": scene, "affected": len(target)}
        except Exception as exc:
            return {"ok": False, "error": str(exc), "scene": scene, "mode": mode}

    @app.post("/api/assistant/chat")
    def assistant_chat() -> Any:
        access = require_active_home_access()
        if not isinstance(access, dict):
            return access

        payload = request.get_json(silent=True) or {}
        text = str(payload.get("text", "")).strip()
        audit(
            "assistant.chat",
            actor=access.get("user"),
            target_type="assistant",
            home_id=access["home"]["id"] if access.get("home") else None,
            metadata={"text": text[:200]},
        )

        def chat_json(payload: dict[str, Any]) -> Any:
            if "reply" in payload:
                payload = {**payload, "reply": polish_assistant_reply(payload["reply"])}
            return jsonify(payload)

        if not text:
            return chat_json({"reply": "Bạn hãy nhập lệnh cần điều khiển hoặc câu hỏi về điện năng."})

        intent = parse_intent(text, devices)

        if intent["intent"] == "get_power_current":
            power, status = unpack_view_result(power_current())
            if status >= 400 or not power.get("source"):
                return chat_json({"intent": intent, "reply": f"Không thể đọc dữ liệu điện năng: {power.get('error', 'server lỗi')}"})
            return chat_json({"intent": intent, "reply": f"Công suất hiện tại khoảng {power.get('power_kw')} kW."})

        if intent["intent"] == "turn_off_all":
            control_access = require_active_home_access(manage_devices=True)
            if not isinstance(control_access, dict):
                return control_access
            result = execute_scene(control_access, "work")
            if not result["ok"]:
                return chat_json({"intent": intent, "reply": f"Không thể tắt tất cả thiết bị: {result.get('error', 'server lỗi')}", "error": result})
            return chat_json({"intent": intent, "reply": "Đã gửi lệnh tắt tất cả thiết bị."})

        if intent["intent"] == "turn_on_all":
            control_access = require_active_home_access(manage_devices=True)
            if not isinstance(control_access, dict):
                return control_access
            result = execute_scene(control_access, "weekend")
            if not result["ok"]:
                return chat_json({"intent": intent, "reply": f"Không thể bật tất cả thiết bị: {result.get('error', 'server lỗi')}", "error": result})
            return chat_json({"intent": intent, "reply": "Đã gửi lệnh bật tất cả thiết bị."})

        if intent["intent"] == "apply_scene":
            control_access = require_active_home_access(manage_devices=True)
            if not isinstance(control_access, dict):
                return control_access
            result = execute_scene(control_access, str(intent["scene"]))
            if not result["ok"]:
                return chat_json({"intent": intent, "reply": f"Không thể kích hoạt cảnh {intent['scene']}: {result.get('error', 'server lỗi')}", "error": result})
            return chat_json({"intent": intent, "reply": f"Đã kích hoạt cảnh {intent['scene']}."})

        if intent["intent"] in {"turn_on_device", "turn_off_device"}:
            control_access = require_active_home_access(manage_devices=True)
            if not isinstance(control_access, dict):
                return control_access
            is_on = intent["intent"] == "turn_on_device"
            device = next((item for item in devices if str(item["id"]) == str(intent["device_id"])), None)
            if not device:
                return chat_json({"intent": intent, "reply": f"Không tìm thấy thiết bị {intent['device_id']}."})
            result = execute_device_command(control_access, device, is_on)
            action = "bật" if is_on else "tắt"
            if not result["ok"]:
                return chat_json({"intent": intent, "reply": f"Không thể {action} {intent.get('device_name', intent['device_id'])}: {result.get('error', 'server lỗi')}", "error": result})
            return chat_json({"intent": intent, "reply": f"Đã gửi lệnh {action} {intent.get('device_name', intent['device_id'])}."})

        if intent["intent"] == "set_filtered_devices":
            control_access = require_active_home_access(manage_devices=True)
            if not isinstance(control_access, dict):
                return control_access
            affected = 0
            errors: list[dict[str, Any]] = []
            for device in devices:
                if intent.get("room_id") and device.get("roomId") != intent["room_id"]:
                    continue
                if intent.get("device_type") and device.get("type") != intent["device_type"]:
                    continue
                result = execute_device_command(control_access, device, bool(intent["is_on"]))
                if result["ok"]:
                    affected += 1
                else:
                    errors.append(result)
            if errors:
                return chat_json({"intent": intent, "reply": f"Chỉ gửi được lệnh cho {affected} thiết bị, {len(errors)} thiết bị lỗi: {errors[0].get('error', 'server lỗi')}", "errors": errors})
            return chat_json({"intent": intent, "reply": f"Đã gửi lệnh cho {affected} thiết bị phù hợp."})

        if intent["intent"] == "list_devices":
            grouped = group_devices(devices, read_states())
            total = sum(len(items) for items in grouped.values())
            return chat_json({"intent": intent, "reply": f"Hệ thống đang có {total} thiết bị trong 4 khu vực."})

        if intent["intent"] == "get_forecast":
            return chat_json({"intent": intent, "reply": "Chức năng dự báo sẽ đọc Forecast API sau khi có dữ liệu lịch sử từ PLC."})

        context = build_assistant_context(access)
        provider_result = run_assistant_provider(text, context, config)
        audit(
            "assistant.provider_reply",
            actor=access.get("user"),
            target_type="assistant",
            home_id=access["home"]["id"] if access.get("home") else None,
            metadata={
                "provider": provider_result.get("provider"),
                "ok": provider_result.get("ok"),
                "fallbackProvider": provider_result.get("fallbackProvider"),
            },
        )
        response = {
            "intent": intent,
            "reply": provider_result["reply"],
            "assistantProvider": provider_result.get("provider"),
            "assistantProviderOk": provider_result.get("ok"),
        }
        if provider_result.get("error"):
            response["assistantProviderError"] = provider_result["error"]
            response["assistantFallbackProvider"] = provider_result.get("fallbackProvider")
        return chat_json(response)

    if collector_enabled and os.environ.get("SMART_HOME_DISABLE_COLLECTOR") != "1":
        collector_thread = threading.Thread(target=power_collector_loop, name="power-collector", daemon=True)
        collector_thread.start()

    return app


if __name__ == "__main__":
    loaded = load_config()
    server_config = loaded.get("server", {})
    create_app().run(
        host=str(server_config.get("host", "0.0.0.0")),
        port=int(server_config.get("port", 5001)),
        debug=bool(server_config.get("debug", False)),
    )
