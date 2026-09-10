from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import Mock, patch


SERVER_DIR = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

# Keep this integration fixture offline even when a developer's .env contains
# provider or notification credentials.  The app import loads dotenv at module
# scope, so suppress that load before importing it.
os.environ["SMART_HOME_DISABLE_COLLECTOR"] = "1"
with patch("dotenv.load_dotenv", return_value=False):
    import app as smart_home_app  # noqa: E402


class SecurityControlsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        root = Path(self.temp_dir.name)
        self.db_path = root / "auth.db"
        self.config_path = root / "config.json"
        self.state_path = root / "state.json"
        self.config_path.write_text(
            json.dumps(
                {
                    "mode": "mock",
                    "security": {
                        "apiToken": "",
                        "allowedOrigins": ["https://admin.smarthomeai.id.vn"],
                    },
                    "safety": {"autoLoadSheddingEnabled": False},
                    "telemetry": {
                        "serviceToken": "test-telemetry-token",
                        "allowedHomeIds": ["home-demo-001"],
                    },
                    "database": {"path": str(self.db_path)},
                    "powerCollector": {"enabled": False, "homeIds": ["home-demo-001"]},
                    "plc": {"host": "127.0.0.1", "rack": 0, "slot": 1},
                    "powerTags": {},
                    "devices": [
                        {
                            "id": "test-light",
                            "roomId": "living",
                            "name": "Test light",
                            "type": "light",
                            "power": 40,
                            "statusTag": "DB1.DBX0.0",
                            "onCommandTag": "DB7.DBX0.0",
                            "offCommandTag": "DB7.DBX0.1",
                        },
                        {
                            "id": "test-fan",
                            "roomId": "living",
                            "name": "Test fan",
                            "type": "fan",
                            "power": 60,
                            "statusTag": "DB1.DBX0.1",
                            "onCommandTag": "DB7.DBX0.2",
                            "offCommandTag": "DB7.DBX0.3",
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )

        os.environ.update(
            {
                "SMART_HOME_SEED_DEMO_USERS": "true",
                "SMART_HOME_BOOTSTRAP_ADMIN_PASSWORD": "test-admin-password",
                "SMART_HOME_BOOTSTRAP_OWNER_PASSWORD": "test-owner-password",
                "SMART_HOME_BOOTSTRAP_MEMBER_PASSWORD": "test-member-password",
                "SMART_HOME_TELEMETRY_TOKEN": "test-telemetry-token",
                "SMART_HOME_AUTO_LOAD_SHEDDING_ENABLED": "false",
                "SMART_HOME_API_TOKEN": "",
                "SMART_HOME_CORS_ALLOWED_ORIGINS": "",
                "DATABASE_URL": "",
                "SMART_HOME_LOGIN_ATTEMPT_LIMIT": "3",
                "SMART_HOME_LOGIN_WINDOW_SECONDS": "300",
                "SMART_HOME_LOGIN_LOCK_SECONDS": "60",
            }
        )
        smart_home_app.CONFIG_PATH = self.config_path
        smart_home_app.STATE_PATH = self.state_path
        smart_home_app.AUTH_DB_PATH = self.db_path
        self._external_patches = [
            patch.object(smart_home_app, "send_telegram_alert", return_value=False),
        ]
        for external_patch in self._external_patches:
            external_patch.start()
        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        self.client = flask_app.test_client()

        login = self.client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        self.assertEqual(login.status_code, 200)
        self.owner_token = login.get_json()["token"]

    def tearDown(self) -> None:
        for external_patch in getattr(self, "_external_patches", []):
            external_patch.stop()
        self.temp_dir.cleanup()

    def auth_headers(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def client_with_bedroom_devices(self):
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["devices"].extend(
            [
                {
                    "id": "test-bedroom-light",
                    "roomId": "bedroom",
                    "name": "Test bedroom light",
                    "type": "light",
                    "power": 40,
                    "statusTag": "DB1.DBX0.2",
                    "onCommandTag": "DB7.DBX0.4",
                    "offCommandTag": "DB7.DBX0.5",
                },
                {
                    "id": "test-bedroom-fan",
                    "roomId": "bedroom",
                    "name": "Test bedroom fan",
                    "type": "fan",
                    "power": 60,
                    "statusTag": "DB1.DBX0.3",
                    "onCommandTag": "DB7.DBX0.6",
                    "offCommandTag": "DB7.DBX0.7",
                },
            ]
        )
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        client = flask_app.test_client()
        login = client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        self.assertEqual(login.status_code, 200)
        return client, self.auth_headers(login.get_json()["token"])

    def client_with_living_light_and_ac(self):
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["devices"] = [
            device for device in config["devices"] if device["id"] == "test-light"
        ]
        config["devices"].append(
            {
                "id": "test-ac",
                "roomId": "living",
                "name": "Test air conditioner",
                "type": "ac",
                "power": 1000,
                "statusTag": "DB1.DBX0.1",
                "onCommandTag": "DB7.DBX0.2",
                "offCommandTag": "DB7.DBX0.3",
            }
        )
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        client = flask_app.test_client()
        login = client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        self.assertEqual(login.status_code, 200)
        return client, self.auth_headers(login.get_json()["token"])

    def client_with_living_named_lights(self):
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["devices"] = [
            device for device in config["devices"] if device["id"] == "test-light"
        ]
        config["devices"].extend(
            [
                {
                    "id": "test-living-desk-light",
                    "roomId": "living",
                    "name": "Đèn bàn",
                    "type": "light",
                    "power": 40,
                    "statusTag": "DB1.DBX0.2",
                    "onCommandTag": "DB7.DBX0.4",
                    "offCommandTag": "DB7.DBX0.5",
                },
                {
                    "id": "test-living-ceiling-light",
                    "roomId": "living",
                    "name": "Đèn trần",
                    "type": "light",
                    "power": 40,
                    "statusTag": "DB1.DBX0.3",
                    "onCommandTag": "DB7.DBX0.6",
                    "offCommandTag": "DB7.DBX0.7",
                },
                {
                    "id": "test-living-light-b",
                    "roomId": "living",
                    "name": "Đèn B",
                    "type": "light",
                    "power": 40,
                    "statusTag": "DB1.DBX0.4",
                    "onCommandTag": "DB7.DBX1.0",
                    "offCommandTag": "DB7.DBX1.1",
                },
                {
                    "id": "test-living-light-a",
                    "roomId": "living",
                    "name": "Đèn A",
                    "type": "light",
                    "power": 40,
                    "statusTag": "DB1.DBX0.5",
                    "onCommandTag": "DB7.DBX1.2",
                    "offCommandTag": "DB7.DBX1.3",
                },
            ]
        )
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        client = flask_app.test_client()
        login = client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        self.assertEqual(login.status_code, 200)
        return client, self.auth_headers(login.get_json()["token"])

    def test_repeated_room_creation_is_idempotent_by_normalized_name(self) -> None:
        payload = {"name": "  Phòng QA timeout  ", "type": "room"}
        first = self.client.post(
            "/api/homes/home-demo-001/rooms",
            json=payload,
            headers=self.auth_headers(self.owner_token),
        )
        second = self.client.post(
            "/api/homes/home-demo-001/rooms",
            json={"name": "phòng qa TIMEOUT", "type": "room"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.get_json()["room"]["id"], second.get_json()["room"]["id"])
        rooms = self.client.get(
            "/api/homes/home-demo-001/rooms",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["rooms"]
        self.assertEqual(sum(room["name"].strip().casefold() == "phòng qa timeout" for room in rooms), 1)

    def test_repeated_device_creation_is_idempotent_within_room(self) -> None:
        room = self.client.post(
            "/api/homes/home-demo-001/rooms",
            json={"name": "Phòng thiết bị QA", "type": "room"},
            headers=self.auth_headers(self.owner_token),
        ).get_json()["room"]
        payload = {
            "roomId": room["id"],
            "name": "Đèn kiểm thử",
            "type": "light",
            "status": "off",
            "ratedPowerW": 20,
            "isControllable": False,
        }
        first = self.client.post(
            "/api/homes/home-demo-001/devices",
            json=payload,
            headers=self.auth_headers(self.owner_token),
        )
        second = self.client.post(
            "/api/homes/home-demo-001/devices",
            json={**payload, "name": "  đèn KIỂM THỬ "},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.get_json()["device"]["id"], second.get_json()["device"]["id"])

    def test_cors_allows_configured_admin_origin_only(self) -> None:
        allowed = self.client.options(
            "/api/auth/login",
            headers={"Origin": "https://admin.smarthomeai.id.vn"},
        )
        self.assertEqual(
            allowed.headers.get("Access-Control-Allow-Origin"),
            "https://admin.smarthomeai.id.vn",
        )

        denied = self.client.options(
            "/api/auth/login",
            headers={"Origin": "https://attacker.example"},
        )
        self.assertIsNone(denied.headers.get("Access-Control-Allow-Origin"))

    def test_telemetry_is_service_only_and_get_is_read_only(self) -> None:
        payload = {
            "homeId": "home-demo-001",
            "power_kw": 1.25,
            "energy_kwh": 3000,
            "source": "test-meter",
        }
        self.assertEqual(self.client.post("/api/power/readings", json=payload).status_code, 401)
        self.assertEqual(
            self.client.post(
                "/api/power/readings",
                json=payload,
                headers=self.auth_headers(self.owner_token),
            ).status_code,
            401,
        )
        accepted = self.client.post(
            "/api/power/readings",
            json=payload,
            headers={"X-Telemetry-Token": "test-telemetry-token"},
        )
        self.assertEqual(accepted.status_code, 201)

        with closing(sqlite3.connect(self.db_path)) as conn:
            before = conn.execute("SELECT COUNT(*) FROM power_readings").fetchone()[0]
        reading = self.client.get(
            "/api/power/current?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        )
        self.assertEqual(reading.status_code, 200)
        self.assertFalse(reading.get_json()["recorded"])
        with closing(sqlite3.connect(self.db_path)) as conn:
            after = conn.execute("SELECT COUNT(*) FROM power_readings").fetchone()[0]
        self.assertEqual(before, after)

    def test_auto_shedding_is_fail_closed(self) -> None:
        turned_on = self.client.post(
            "/api/devices/test-light/turn-on?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        )
        self.assertEqual(turned_on.status_code, 200)

        accepted = self.client.post(
            "/api/power/readings",
            json={"homeId": "home-demo-001", "energy_kwh": 9999, "power_kw": 2.0},
            headers={"X-Telemetry-Token": "test-telemetry-token"},
        )
        self.assertEqual(accepted.status_code, 201)

        devices = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        test_light = next(item for item in devices["living"] if item["id"] == "test-light")
        self.assertTrue(test_light["isOn"])

    def test_chat_can_turn_on_multiple_named_devices_in_one_room(self) -> None:
        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn và quạt phòng khách"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "set_devices")
        self.assertEqual(payload["intent"]["device_ids"], ["test-light", "test-fan"])
        self.assertIn("2 thiết bị", payload["reply"])

        devices = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]["living"]
        self.assertTrue(next(item for item in devices if item["id"] == "test-light")["isOn"])
        self.assertTrue(next(item for item in devices if item["id"] == "test-fan")["isOn"])

    def test_chat_answers_state_question_without_mutating_mock_state(self) -> None:
        turned_on = self.client.post(
            "/api/devices/test-light/turn-on?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        )
        self.assertEqual(turned_on.status_code, 200)
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]

        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Đèn phòng khách có đang bật không?"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "get_device_state")
        self.assertEqual(payload["intent"]["device_id"], "test-light")
        self.assertIn("đang bật", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_does_not_execute_negated_control(self) -> None:
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]

        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Đừng bật đèn phòng khách"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertIn("chưa thực hiện", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_clarifies_mixed_on_and_off_without_mutating_mock_state(self) -> None:
        client, headers = self.client_with_bedroom_devices()
        before = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]

        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn phòng khách và tắt quạt phòng ngủ"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertIn("một thao tác", payload["reply"].lower())
        after = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_clarifies_common_negative_control_forms(self) -> None:
        for text in (
            "Không bật đèn phòng khách",
            "Chưa bật đèn phòng khách",
            "Không được bật đèn phòng khách",
        ):
            with self.subTest(text=text):
                before = self.client.get(
                    "/api/devices?homeId=home-demo-001",
                    headers=self.auth_headers(self.owner_token),
                ).get_json()["devices"]
                response = self.client.post(
                    "/api/assistant/chat?homeId=home-demo-001",
                    json={"text": text},
                    headers=self.auth_headers(self.owner_token),
                )

                self.assertEqual(response.status_code, 200)
                payload = response.get_json()
                self.assertEqual(payload["intent"]["intent"], "clarify")
                self.assertIn("chưa thực hiện", payload["reply"].lower())
                after = self.client.get(
                    "/api/devices?homeId=home-demo-001",
                    headers=self.auth_headers(self.owner_token),
                ).get_json()["devices"]
                self.assertEqual(before, after)

    def test_chat_clarifies_question_about_control_without_provider_or_mutation(self) -> None:
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        with patch.object(smart_home_app, "run_assistant_provider") as provider:
            response = self.client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Có nên bật đèn phòng khách?"},
                headers=self.auth_headers(self.owner_token),
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertEqual(payload["intent"]["reason"], "question_control")
        self.assertIn("câu hỏi", payload["reply"].lower())
        provider.assert_not_called()
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_clarifies_exclusion_control_without_mutation(self) -> None:
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn phòng khách trừ quạt"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertEqual(payload["intent"]["reason"], "exclusion_control")
        self.assertIn("chưa thực hiện", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_scene_exclusion_is_clarified_without_mutation(self) -> None:
        for device_id in ("test-light", "test-fan"):
            turned_on = self.client.post(
                f"/api/devices/{device_id}/turn-on?homeId=home-demo-001",
                headers=self.auth_headers(self.owner_token),
            )
            self.assertEqual(turned_on.status_code, 200)
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]

        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Đi ngủ trừ đèn phòng khách"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertEqual(payload["intent"]["reason"], "exclusion_control")
        self.assertIn("chưa thực hiện", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_explains_sleep_scene_without_applying_it(self) -> None:
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        with patch.object(smart_home_app, "run_assistant_provider") as provider:
            response = self.client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Chế độ ngủ là gì?"},
                headers=self.auth_headers(self.owner_token),
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "explain_scene")
        self.assertEqual(payload["intent"]["scene"], "sleep")
        self.assertIn("không tắt thiết bị", payload["reply"].lower())
        provider.assert_not_called()
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_answers_off_state_without_mutating_mock_state(self) -> None:
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertFalse(next(item for item in before["living"] if item["id"] == "test-light")["isOn"])

        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Đèn phòng khách có đang bật không?"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "get_device_state")
        self.assertIn("đang tắt", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_does_not_fabricate_off_when_plc_omits_state(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "plc-real"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")

        with patch.object(smart_home_app.S7Client, "read_device_states", return_value={}):
            flask_app = smart_home_app.create_app()
            flask_app.testing = True
            client = flask_app.test_client()
            login = client.post(
                "/api/auth/login",
                json={"username": "owner", "password": "test-owner-password"},
            )
            self.assertEqual(login.status_code, 200)
            response = client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Đèn phòng khách có đang bật không?"},
                headers=self.auth_headers(login.get_json()["token"]),
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "get_device_state")
        self.assertIn("chưa xác định", payload["reply"].lower())

    def test_chat_uses_successful_plc_state_for_state_question(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "plc-real"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        plc_states = {"test-light": True, "test-fan": False}

        with patch.object(smart_home_app.S7Client, "read_device_states", return_value=plc_states):
            flask_app = smart_home_app.create_app()
            flask_app.testing = True
            client = flask_app.test_client()
            login = client.post(
                "/api/auth/login",
                json={"username": "owner", "password": "test-owner-password"},
            )
            self.assertEqual(login.status_code, 200)
            response = client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Đèn phòng khách có đang bật không?"},
                headers=self.auth_headers(login.get_json()["token"]),
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("đang bật", response.get_json()["reply"].lower())

    def test_chat_does_not_claim_stale_mock_state_after_auto_plc_failure(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "auto"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")

        with patch.object(smart_home_app.S7Client, "read_device_states", side_effect=RuntimeError("PLC offline")):
            flask_app = smart_home_app.create_app()
            flask_app.testing = True
            client = flask_app.test_client()
            login = client.post(
                "/api/auth/login",
                json={"username": "owner", "password": "test-owner-password"},
            )
            self.assertEqual(login.status_code, 200)
            response = client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Đèn phòng khách có đang bật không?"},
                headers=self.auth_headers(login.get_json()["token"]),
            )

        self.assertEqual(response.status_code, 200)
        self.assertIn("chưa xác định", response.get_json()["reply"].lower())

    def test_plc_real_failure_keeps_devices_api_error_contract(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "plc-real"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")

        with patch.object(smart_home_app.S7Client, "read_device_states", side_effect=RuntimeError("PLC offline")):
            flask_app = smart_home_app.create_app()
            flask_app.testing = True
            client = flask_app.test_client()
            login = client.post(
                "/api/auth/login",
                json={"username": "owner", "password": "test-owner-password"},
            )
            self.assertEqual(login.status_code, 200)
            headers = self.auth_headers(login.get_json()["token"])
            chat_response = client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Đèn phòng khách có đang bật không?"},
                headers=headers,
            )
            devices_response = client.get(
                "/api/devices?homeId=home-demo-001",
                headers=headers,
            )

        self.assertEqual(chat_response.status_code, 200)
        self.assertIn("chưa xác định", chat_response.get_json()["reply"].lower())
        self.assertEqual(devices_response.status_code, 500)

    def test_chat_does_not_execute_negated_scene(self) -> None:
        for device_id in ("test-light", "test-fan"):
            turned_on = self.client.post(
                f"/api/devices/{device_id}/turn-on?homeId=home-demo-001",
                headers=self.auth_headers(self.owner_token),
            )
            self.assertEqual(turned_on.status_code, 200)
        before = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]

        response = self.client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Đừng đi ngủ"},
            headers=self.auth_headers(self.owner_token),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "clarify")
        self.assertIn("chưa thực hiện", payload["reply"].lower())
        after = self.client.get(
            "/api/devices?homeId=home-demo-001",
            headers=self.auth_headers(self.owner_token),
        ).get_json()["devices"]
        self.assertEqual(before, after)

    def test_chat_routes_forecast_power_overlap_to_provider(self) -> None:
        with patch.object(
            smart_home_app,
            "run_assistant_provider",
            return_value={"ok": True, "provider": "gemini", "reply": "Dự báo đang được xử lý."},
        ) as provider:
            response = self.client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Dự báo điện năng hiện tại ngày mai thế nào?"},
                headers=self.auth_headers(self.owner_token),
            )

        self.assertEqual(response.status_code, 200)
        provider.assert_called_once()
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "get_forecast")
        self.assertEqual(payload["reply"], "Dự báo đang được xử lý.")

    def test_chat_does_not_substitute_another_device_type(self) -> None:
        client, headers = self.client_with_living_light_and_ac()
        before = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]

        light_response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn phòng khách"},
            headers=headers,
        )
        self.assertEqual(light_response.status_code, 200)
        light_payload = light_response.get_json()
        self.assertEqual(light_payload["intent"]["intent"], "turn_on_device")
        self.assertEqual(light_payload["intent"]["device_id"], "test-light")
        after_light = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        self.assertTrue(next(item for item in after_light["living"] if item["id"] == "test-light")["isOn"])
        self.assertFalse(next(item for item in after_light["living"] if item["id"] == "test-ac")["isOn"])

        before_missing = after_light
        missing_response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật quạt phòng khách"},
            headers=headers,
        )
        self.assertEqual(missing_response.status_code, 200)
        missing_payload = missing_response.get_json()
        self.assertEqual(missing_payload["intent"]["intent"], "clarify")
        self.assertIn("chưa thực hiện", missing_payload["reply"].lower())
        after_missing = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        self.assertEqual(before_missing, after_missing)

    def test_chat_can_turn_on_one_device_type_in_multiple_rooms(self) -> None:
        client, headers = self.client_with_bedroom_devices()
        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn phòng khách và phòng ngủ"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "set_devices")
        self.assertEqual(payload["intent"]["device_ids"], ["test-light", "test-bedroom-light"])

        devices = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        self.assertTrue(next(item for item in devices["living"] if item["id"] == "test-light")["isOn"])
        self.assertTrue(next(item for item in devices["bedroom"] if item["id"] == "test-bedroom-light")["isOn"])

    def test_chat_sends_forecast_questions_to_the_assistant_provider(self) -> None:
        with patch.object(
            smart_home_app,
            "run_assistant_provider",
            return_value={"ok": True, "provider": "gemini", "reply": "Chưa có dữ liệu dự báo mới để kết luận."},
        ) as provider:
            response = self.client.post(
                "/api/assistant/chat?homeId=home-demo-001",
                json={"text": "Dự báo điện năng ngày mai thế nào?"},
                headers=self.auth_headers(self.owner_token),
            )

        self.assertEqual(response.status_code, 200)
        provider.assert_called_once()
        payload = response.get_json()
        self.assertEqual(payload["reply"], "Chưa có dữ liệu dự báo mới để kết luận.")
        self.assertEqual(payload["assistantSource"], "ai")
        self.assertEqual(payload["assistantProvider"], "gemini")

    def test_chat_keeps_each_device_type_scoped_to_its_named_room(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        next(device for device in config["devices"] if device["id"] == "test-fan")["name"] = "Quạt phòng khách"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        client, headers = self.client_with_bedroom_devices()
        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn phòng khách và quạt phòng ngủ"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "set_devices")
        self.assertEqual(payload["intent"]["device_ids"], ["test-light", "test-bedroom-fan"])

        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn và quạt phòng khách và phòng ngủ"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "set_devices")
        self.assertEqual(
            payload["intent"]["device_ids"],
            ["test-light", "test-fan", "test-bedroom-light", "test-bedroom-fan"],
        )

    def test_chat_scopes_each_device_type_for_cung_connectors(self) -> None:
        client, headers = self.client_with_bedroom_devices()
        for text in (
            "Bật đèn phòng khách cùng quạt phòng ngủ",
            "Bật đèn phòng khách cùng với quạt phòng ngủ",
        ):
            with self.subTest(text=text):
                response = client.post(
                    "/api/assistant/chat?homeId=home-demo-001",
                    json={"text": text},
                    headers=headers,
                )

                self.assertEqual(response.status_code, 200)
                payload = response.get_json()
                self.assertEqual(payload["intent"]["intent"], "set_devices")
                self.assertEqual(payload["intent"]["device_ids"], ["test-light", "test-bedroom-fan"])

        devices = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        self.assertTrue(next(item for item in devices["living"] if item["id"] == "test-light")["isOn"])
        self.assertTrue(next(item for item in devices["bedroom"] if item["id"] == "test-bedroom-fan")["isOn"])
        self.assertFalse(next(item for item in devices["living"] if item["id"] == "test-fan")["isOn"])
        self.assertFalse(next(item for item in devices["bedroom"] if item["id"] == "test-bedroom-light")["isOn"])

    def test_chat_prefers_unique_explicit_device_name_over_room_group(self) -> None:
        client, headers = self.client_with_living_named_lights()
        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn bàn phòng khách"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "turn_on_device")
        self.assertEqual(payload["intent"]["device_id"], "test-living-desk-light")

        devices = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]["living"]
        self.assertTrue(next(item for item in devices if item["id"] == "test-living-desk-light")["isOn"])
        self.assertFalse(next(item for item in devices if item["id"] == "test-living-ceiling-light")["isOn"])

        response = client.post(
            "/api/assistant/chat?homeId=home-demo-001",
            json={"text": "Bật đèn A phòng khách"},
            headers=headers,
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"]["intent"], "turn_on_device")
        self.assertEqual(payload["intent"]["device_id"], "test-living-light-a")
        devices = client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]["living"]
        self.assertTrue(next(item for item in devices if item["id"] == "test-living-light-a")["isOn"])
        self.assertFalse(next(item for item in devices if item["id"] == "test-living-light-b")["isOn"])

    def test_auto_shedding_cannot_be_enabled_before_kw_safety_algorithm_exists(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["safety"]["autoLoadSheddingEnabled"] = True
        self.config_path.write_text(json.dumps(config), encoding="utf-8")

        with patch.dict(os.environ, {"SMART_HOME_AUTO_LOAD_SHEDDING_ENABLED": "true"}):
            guarded_app = smart_home_app.create_app()
        guarded_app.testing = True
        guarded_client = guarded_app.test_client()
        login = guarded_client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        self.assertEqual(login.status_code, 200)
        token = login.get_json()["token"]
        headers = self.auth_headers(token)

        self.assertEqual(
            guarded_client.post(
                "/api/homes/home-demo-001/quota",
                json={"energyLimitKwh": 1},
                headers=headers,
            ).status_code,
            200,
        )
        self.assertEqual(
            guarded_client.post(
                "/api/power/readings",
                json={"homeId": "home-demo-001", "energy_kwh": 0, "power_kw": 0.1},
                headers={"X-Telemetry-Token": "test-telemetry-token"},
            ).status_code,
            201,
        )
        self.assertEqual(
            guarded_client.post(
                "/api/devices/test-light/turn-on?homeId=home-demo-001",
                headers=headers,
            ).status_code,
            200,
        )
        self.assertEqual(
            guarded_client.post(
                "/api/power/readings",
                json={"homeId": "home-demo-001", "energy_kwh": 9999, "power_kw": 2.0},
                headers={"X-Telemetry-Token": "test-telemetry-token"},
            ).status_code,
            201,
        )

        devices = guarded_client.get(
            "/api/devices?homeId=home-demo-001",
            headers=headers,
        ).get_json()["devices"]
        test_light = next(item for item in devices["living"] if item["id"] == "test-light")
        self.assertTrue(test_light["isOn"])

    def test_viewer_cannot_receive_device_permission(self) -> None:
        created = self.client.post(
            "/api/homes/home-demo-001/members",
            headers=self.auth_headers(self.owner_token),
            json={
                "name": "Read only",
                "username": "read-only-user",
                "password": "viewer-password",
                "roleInHome": "viewer",
                "canManageDevices": True,
                "canManageMembers": True,
            },
        )
        self.assertEqual(created.status_code, 201)
        self.assertFalse(created.get_json()["member"]["canManageDevices"])

        login = self.client.post(
            "/api/auth/login",
            json={"username": "read-only-user", "password": "viewer-password"},
        )
        viewer_token = login.get_json()["token"]
        control = self.client.post(
            "/api/devices/test-light/turn-off?homeId=home-demo-001",
            headers=self.auth_headers(viewer_token),
        )
        self.assertEqual(control.status_code, 403)

    def test_auto_mode_collector_does_not_persist_mock_fallback(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "auto"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")

        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        client = flask_app.test_client()
        login = client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "test-admin-password"},
        )
        self.assertEqual(login.status_code, 200)
        token = login.get_json()["token"]

        with closing(sqlite3.connect(self.db_path)) as conn:
            before = conn.execute("SELECT COUNT(*) FROM power_readings").fetchone()[0]
        with patch.object(smart_home_app.S7Client, "read_power", side_effect=RuntimeError("PLC offline")):
            response = client.post(
                "/api/power/collector/run-once",
                headers=self.auth_headers(token),
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["readings"], 0)
        self.assertIn("warning", response.get_json())
        with closing(sqlite3.connect(self.db_path)) as conn:
            after = conn.execute("SELECT COUNT(*) FROM power_readings").fetchone()[0]
        self.assertEqual(before, after)

    def test_logout_revokes_server_session(self) -> None:
        logout = self.client.post(
            "/api/auth/logout",
            headers=self.auth_headers(self.owner_token),
        )
        self.assertEqual(logout.status_code, 200)
        self.assertTrue(logout.get_json()["revoked"])
        self.assertEqual(
            self.client.get("/api/me", headers=self.auth_headers(self.owner_token)).status_code,
            401,
        )

    def test_login_rate_limit_blocks_repeated_failures(self) -> None:
        for _ in range(3):
            response = self.client.post(
                "/api/auth/login",
                json={"username": "rate-limited-user", "password": "wrong-password"},
            )
            self.assertEqual(response.status_code, 401)
        blocked = self.client.post(
            "/api/auth/login",
            json={"username": "rate-limited-user", "password": "wrong-password"},
        )
        self.assertEqual(blocked.status_code, 429)
        self.assertIn("Retry-After", blocked.headers)

    def test_expired_session_and_suspended_user_are_rejected(self) -> None:
        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.execute(
                "UPDATE sessions SET expires_at = ? WHERE token = ?",
                ("2000-01-01T00:00:00+00:00", self.owner_token),
            )
            conn.commit()
        self.assertEqual(
            self.client.get("/api/me", headers=self.auth_headers(self.owner_token)).status_code,
            401,
        )

        with closing(sqlite3.connect(self.db_path)) as conn:
            conn.execute("UPDATE users SET status = 'suspended' WHERE username = 'member'")
            conn.commit()
        suspended = self.client.post(
            "/api/auth/login",
            json={"username": "member", "password": "test-member-password"},
        )
        self.assertEqual(suspended.status_code, 401)

    def test_password_change_keeps_current_session_and_updates_credentials(self) -> None:
        changed = self.client.patch(
            "/api/auth/change-password",
            headers=self.auth_headers(self.owner_token),
            json={
                "currentPassword": "test-owner-password",
                "newPassword": "new-owner-password-2026",
            },
        )
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(
            self.client.get("/api/me", headers=self.auth_headers(self.owner_token)).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(
                "/api/auth/login",
                json={"username": "owner", "password": "new-owner-password-2026"},
            ).status_code,
            200,
        )

    def test_cross_home_user_cannot_control_global_physical_device(self) -> None:
        admin_login = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "test-admin-password"},
        )
        admin_token = admin_login.get_json()["token"]
        created = self.client.post(
            "/api/admin/owners",
            headers=self.auth_headers(admin_token),
            json={
                "ownerName": "Second owner",
                "username": "second-owner",
                "password": "second-owner-password",
                "homeName": "Second home",
            },
        )
        self.assertEqual(created.status_code, 201)
        second_home_id = created.get_json()["home"]["id"]
        second_login = self.client.post(
            "/api/auth/login",
            json={"username": "second-owner", "password": "second-owner-password"},
        )
        second_token = second_login.get_json()["token"]
        control = self.client.post(
            f"/api/devices/test-light/turn-on?homeId={second_home_id}",
            headers=self.auth_headers(second_token),
        )
        self.assertEqual(control.status_code, 403)
        self.assertEqual(control.get_json()["reason"], "device_scope_denied")

    def test_cross_home_user_cannot_read_global_physical_device_state(self) -> None:
        admin_login = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "test-admin-password"},
        )
        admin_token = admin_login.get_json()["token"]
        created = self.client.post(
            "/api/admin/owners",
            headers=self.auth_headers(admin_token),
            json={
                "ownerName": "Second owner",
                "username": "second-owner",
                "password": "second-owner-password",
                "homeName": "Second home",
            },
        )
        self.assertEqual(created.status_code, 201)
        second_home_id = created.get_json()["home"]["id"]
        second_login = self.client.post(
            "/api/auth/login",
            json={"username": "second-owner", "password": "second-owner-password"},
        )
        response = self.client.post(
            f"/api/assistant/chat?homeId={second_home_id}",
            json={"text": "Đèn phòng khách có đang bật không?"},
            headers=self.auth_headers(second_login.get_json()["token"]),
        )

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.get_json()["reason"], "device_scope_denied")

    def test_scene_reports_partial_failure_per_device(self) -> None:
        config = json.loads(self.config_path.read_text(encoding="utf-8"))
        config["mode"] = "auto"
        self.config_path.write_text(json.dumps(config), encoding="utf-8")
        flask_app = smart_home_app.create_app()
        flask_app.testing = True
        client = flask_app.test_client()
        login = client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        token = login.get_json()["token"]

        with patch.object(
            smart_home_app.S7Client,
            "write_device_command",
            side_effect=[
                {"verified": True, "actualState": True, "latencyMs": 1.0},
                RuntimeError("second device failed"),
            ],
        ):
            response = client.post(
                "/api/scenes/weekend?homeId=home-demo-001",
                headers=self.auth_headers(token),
            )
        self.assertEqual(response.status_code, 409)
        body = response.get_json()
        self.assertEqual(body["reason"], "partial_failure")
        self.assertEqual(body["affected"], 1)
        self.assertEqual(body["failed"], 1)
        self.assertEqual(len(body["results"]), 2)

    def test_emergency_stop_and_reset_flow(self) -> None:
        login = self.client.post(
            "/api/auth/login",
            json={"username": "owner", "password": "test-owner-password"},
        )
        token = login.get_json()["token"]
        headers = self.auth_headers(token)

        # 1. Trigger emergency stop
        stop_res = self.client.post("/api/system/emergency-stop?homeId=home-demo-001", headers=headers)
        self.assertEqual(stop_res.status_code, 200)
        self.assertTrue(stop_res.get_json()["emergencyStop"])

        # 2. Check system status reports emergencyStop = True
        status_res = self.client.get("/api/system/status", headers=headers)
        self.assertEqual(status_res.status_code, 200)
        self.assertTrue(status_res.get_json()["emergencyStop"])

        # 3. Attempting to turn on a device is blocked with 403 / emergency_stop_active
        turn_on_res = self.client.post("/api/devices/test-light/turn-on?homeId=home-demo-001", headers=headers)
        self.assertEqual(turn_on_res.status_code, 403)
        self.assertEqual(turn_on_res.get_json()["reason"], "emergency_stop_active")

        # 4. Attempting to apply a scene with active devices is blocked
        scene_res = self.client.post("/api/scenes/morning?homeId=home-demo-001", headers=headers)
        self.assertEqual(scene_res.status_code, 403)
        self.assertEqual(scene_res.get_json()["reason"], "emergency_stop_active")

        # 5. Trigger emergency reset
        reset_res = self.client.post("/api/system/emergency-reset?homeId=home-demo-001", headers=headers)
        self.assertEqual(reset_res.status_code, 200)
        self.assertFalse(reset_res.get_json()["emergencyStop"])

        # 6. Check system status reports emergencyStop = False
        status_res_after = self.client.get("/api/system/status", headers=headers)
        self.assertEqual(status_res_after.status_code, 200)
        self.assertFalse(status_res_after.get_json()["emergencyStop"])

        # 7. Device can be turned on normally now
        turn_on_after = self.client.post("/api/devices/test-light/turn-on?homeId=home-demo-001", headers=headers)
        self.assertEqual(turn_on_after.status_code, 200)
        self.assertTrue(turn_on_after.get_json()["ok"])


class CollectorRetryStateTest(unittest.TestCase):
    def test_warning_or_exception_uses_bounded_backoff(self) -> None:
        failures, delay = smart_home_app.collector_retry_state(60, 0, failed=True)
        self.assertEqual((failures, delay), (1, 60))
        failures, delay = smart_home_app.collector_retry_state(60, failures, failed=True)
        self.assertEqual((failures, delay), (2, 120))
        for _ in range(20):
            failures, delay = smart_home_app.collector_retry_state(60, failures, failed=True)
        self.assertEqual(delay, smart_home_app.COLLECTOR_MAX_BACKOFF_SECONDS)

    def test_success_resets_backoff(self) -> None:
        failures, delay = smart_home_app.collector_retry_state(60, 7, failed=False)
        self.assertEqual((failures, delay), (0, 60))


class PasswordHashCompatibilityTest(unittest.TestCase):
    def test_current_and_legacy_hashes_verify(self) -> None:
        from auth_store import hash_password, verify_password

        self.assertTrue(verify_password("strong-password", hash_password("strong-password")))
        legacy = hash_password("legacy-password", iterations=120_000)
        _algorithm, _iterations, salt, digest = legacy.split("$", 3)
        legacy_format = f"pbkdf2_sha256${salt}${digest}"
        self.assertTrue(verify_password("legacy-password", legacy_format))


class PlcIdempotencyTest(unittest.TestCase):
    def test_matching_feedback_skips_command_pulse(self) -> None:
        client = Mock()
        plc = smart_home_app.S7Client({"plc": {}})
        device = {
            "id": "light",
            "statusTag": "DB1.DBX0.0",
            "onCommandTag": "DB7.DBX0.0",
        }
        with patch.object(plc, "_client", return_value=client), patch.object(
            plc, "read_plc_bit", return_value=True
        ), patch.object(plc, "write_plc_bit") as write_bit:
            result = plc.write_device_command(device, True)
        self.assertTrue(result["idempotent"])
        write_bit.assert_not_called()
        client.disconnect.assert_called_once()


if __name__ == "__main__":
    unittest.main()
