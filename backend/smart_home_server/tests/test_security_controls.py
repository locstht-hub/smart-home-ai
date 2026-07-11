from __future__ import annotations

import json
import os
import sqlite3
import sys
import tempfile
import unittest
from contextlib import closing
from pathlib import Path


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
                    "security": {"apiToken": ""},
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
                "DATABASE_URL": "",
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


if __name__ == "__main__":
    unittest.main()
