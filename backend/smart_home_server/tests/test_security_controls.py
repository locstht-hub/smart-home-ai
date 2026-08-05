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
        self.temp_dir.cleanup()

    def auth_headers(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

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
