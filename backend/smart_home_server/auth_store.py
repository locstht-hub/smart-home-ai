from __future__ import annotations

import hashlib
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator


SESSION_DAYS = 30
DEFAULT_HOME_ENERGY_LIMIT_KWH = 2500.0


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str, salt: str | None = None) -> str:
    current_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), current_salt.encode("utf-8"), 120_000)
    return f"pbkdf2_sha256${current_salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt, expected = stored_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    return secrets.compare_digest(hash_password(password, salt), f"{algorithm}${salt}${expected}")


class AuthStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_db(self) -> None:
        with self.connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    phone TEXT UNIQUE,
                    name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('system_admin', 'owner', 'member', 'viewer')),
                    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
                    created_at TEXT NOT NULL,
                    last_active TEXT
                );

                CREATE TABLE IF NOT EXISTS homes (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    owner_id TEXT NOT NULL REFERENCES users(id),
                    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended')),
                    energy_limit_kwh REAL NOT NULL DEFAULT 2500.0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS home_members (
                    id TEXT PRIMARY KEY,
                    home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role_in_home TEXT NOT NULL CHECK(role_in_home IN ('owner', 'member', 'viewer')),
                    can_manage_members INTEGER NOT NULL DEFAULT 0,
                    can_manage_devices INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    UNIQUE(home_id, user_id)
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS audit_logs (
                    id TEXT PRIMARY KEY,
                    actor_user_id TEXT,
                    actor_username TEXT,
                    actor_role TEXT,
                    action TEXT NOT NULL,
                    target_type TEXT,
                    target_id TEXT,
                    target_name TEXT,
                    home_id TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS power_readings (
                    id TEXT PRIMARY KEY,
                    home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                    timestamp TEXT NOT NULL,
                    voltage REAL,
                    current REAL,
                    power_kw REAL,
                    energy_kwh REAL,
                    source TEXT NOT NULL DEFAULT 'unknown',
                    metadata_json TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS rooms (
                    id TEXT PRIMARY KEY,
                    home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'room',
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(home_id, name)
                );

                CREATE TABLE IF NOT EXISTS devices (
                    id TEXT PRIMARY KEY,
                    home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'other',
                    status TEXT NOT NULL DEFAULT 'unknown',
                    rated_power_w REAL NOT NULL DEFAULT 0.0,
                    is_controllable INTEGER NOT NULL DEFAULT 1,
                    plc_status_tag TEXT,
                    plc_on_command_tag TEXT,
                    plc_off_command_tag TEXT,
                    metadata_json TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(home_id, name)
                );

                CREATE TABLE IF NOT EXISTS device_events (
                    id TEXT PRIMARY KEY,
                    home_id TEXT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
                    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
                    device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
                    actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
                    event_type TEXT NOT NULL,
                    source TEXT NOT NULL DEFAULT 'manual',
                    value_json TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_home ON audit_logs(home_id);
                CREATE INDEX IF NOT EXISTS idx_power_readings_home_time ON power_readings(home_id, timestamp);
                CREATE INDEX IF NOT EXISTS idx_rooms_home_sort ON rooms(home_id, sort_order, name);
                CREATE INDEX IF NOT EXISTS idx_devices_home_room ON devices(home_id, room_id);
                CREATE INDEX IF NOT EXISTS idx_devices_home_type ON devices(home_id, type);
                CREATE INDEX IF NOT EXISTS idx_device_events_home_time ON device_events(home_id, created_at);
                CREATE INDEX IF NOT EXISTS idx_device_events_device_time ON device_events(device_id, created_at);
                """
            )
            self.migrate_db(conn)
            self.seed_defaults(conn)

    def migrate_db(self, conn: sqlite3.Connection) -> None:
        home_columns = {
            row["name"]
            for row in conn.execute("PRAGMA table_info(homes)").fetchall()
        }
        if "energy_limit_kwh" not in home_columns:
            conn.execute(
                f"ALTER TABLE homes ADD COLUMN energy_limit_kwh REAL NOT NULL DEFAULT {DEFAULT_HOME_ENERGY_LIMIT_KWH}"
            )

    def seed_defaults(self, conn: sqlite3.Connection) -> None:
        count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if count:
            return
        if os.environ.get("SMART_HOME_SEED_DEMO_USERS", "").strip().lower() not in {"1", "true", "yes", "on"}:
            return

        admin_password = os.environ.get("SMART_HOME_BOOTSTRAP_ADMIN_PASSWORD", "").strip()
        owner_password = os.environ.get("SMART_HOME_BOOTSTRAP_OWNER_PASSWORD", "").strip()
        member_password = os.environ.get("SMART_HOME_BOOTSTRAP_MEMBER_PASSWORD", "").strip()
        if not all((admin_password, owner_password, member_password)):
            raise RuntimeError(
                "Demo seeding requires SMART_HOME_BOOTSTRAP_ADMIN_PASSWORD, "
                "SMART_HOME_BOOTSTRAP_OWNER_PASSWORD and SMART_HOME_BOOTSTRAP_MEMBER_PASSWORD"
            )

        now = utc_now()
        users = [
            ("system-admin-001", "admin", "0123456789", "System Admin", admin_password, "system_admin"),
            ("owner-demo-001", "owner", "0900000001", "Chủ nhà mẫu", owner_password, "owner"),
            ("member-demo-001", "member", "0900000002", "Thành viên mẫu", member_password, "member"),
        ]

        for user_id, username, phone, name, password, role in users:
            conn.execute(
                """
                INSERT INTO users (id, username, phone, name, password_hash, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
                """,
                (user_id, username, phone, name, hash_password(password), role, now),
            )

        conn.execute(
            """
            INSERT INTO homes (id, name, owner_id, status, created_at)
            VALUES ('home-demo-001', 'Nhà mẫu Smart Home AI', 'owner-demo-001', 'active', ?)
            """,
            (now,),
        )
        conn.execute(
            """
            INSERT INTO home_members (id, home_id, user_id, role_in_home, can_manage_members, can_manage_devices, created_at)
            VALUES ('member-link-owner-001', 'home-demo-001', 'owner-demo-001', 'owner', 1, 1, ?)
            """,
            (now,),
        )
        conn.execute(
            """
            INSERT INTO home_members (id, home_id, user_id, role_in_home, can_manage_members, can_manage_devices, created_at)
            VALUES ('member-link-member-001', 'home-demo-001', 'member-demo-001', 'member', 0, 1, ?)
            """,
            (now,),
        )

    @staticmethod
    def public_user(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "username": row["username"],
            "phone": row["phone"],
            "name": row["name"],
            "role": row["role"],
            "status": row["status"],
            "createdAt": row["created_at"],
            "lastActive": row["last_active"],
        }

    def login(self, username_or_phone: str, password: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM users
                WHERE lower(username) = lower(?) OR phone = ?
                """,
                (username_or_phone, username_or_phone),
            ).fetchone()

            if row is None or row["status"] != "active" or not verify_password(password, row["password_hash"]):
                return None

            token = secrets.token_urlsafe(32)
            now_dt = datetime.now(timezone.utc)
            expires_at = (now_dt + timedelta(days=SESSION_DAYS)).isoformat()
            conn.execute(
                "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
                (token, row["id"], now_dt.isoformat(), expires_at),
            )
            conn.execute("UPDATE users SET last_active = ? WHERE id = ?", (now_dt.isoformat(), row["id"]))

            return {
                "token": token,
                "user": self.public_user(row),
                "homes": self.list_user_homes(conn, row["id"]),
                "expiresAt": expires_at,
            }

    def get_user_by_session(self, token: str) -> dict[str, Any] | None:
        if not token:
            return None

        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*
                FROM sessions
                JOIN users ON users.id = sessions.user_id
                WHERE sessions.token = ? AND sessions.expires_at > ?
                """,
                (token, utc_now()),
            ).fetchone()

            return self.public_user(row) if row else None

    def list_user_homes(self, conn: sqlite3.Connection, user_id: str) -> list[dict[str, Any]]:
        rows = conn.execute(
            """
            SELECT homes.*, home_members.role_in_home, home_members.can_manage_members, home_members.can_manage_devices
            FROM home_members
            JOIN homes ON homes.id = home_members.home_id
            WHERE home_members.user_id = ?
            ORDER BY homes.created_at ASC
            """,
            (user_id,),
        ).fetchall()

        return [
            {
                "id": row["id"],
                "name": row["name"],
                "ownerId": row["owner_id"],
                "status": row["status"],
                "createdAt": row["created_at"],
                "roleInHome": row["role_in_home"],
                "canManageMembers": bool(row["can_manage_members"]),
                "canManageDevices": bool(row["can_manage_devices"]),
            }
            for row in rows
        ]

    def get_me(self, user_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                return None
            return {"user": self.public_user(row), "homes": self.list_user_homes(conn, user_id)}

    def get_home_access(self, user_id: str, home_id: str | None = None) -> dict[str, Any] | None:
        with self.connect() as conn:
            if home_id:
                row = conn.execute(
                    """
                    SELECT homes.*, home_members.role_in_home,
                           home_members.can_manage_members, home_members.can_manage_devices
                    FROM home_members
                    JOIN homes ON homes.id = home_members.home_id
                    WHERE home_members.user_id = ? AND homes.id = ?
                    """,
                    (user_id, home_id),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT homes.*, home_members.role_in_home,
                           home_members.can_manage_members, home_members.can_manage_devices
                    FROM home_members
                    JOIN homes ON homes.id = home_members.home_id
                    WHERE home_members.user_id = ?
                    ORDER BY CASE WHEN homes.status = 'active' THEN 0 ELSE 1 END, homes.created_at ASC
                    LIMIT 1
                    """,
                    (user_id,),
                ).fetchone()

            if row is None:
                return None

            return {
                "id": row["id"],
                "name": row["name"],
                "ownerId": row["owner_id"],
                "status": row["status"],
                "createdAt": row["created_at"],
                "roleInHome": row["role_in_home"],
                "canManageMembers": bool(row["can_manage_members"]),
                "canManageDevices": bool(row["can_manage_devices"]),
            }

    def list_home_members(self, home_id: str) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT users.*, home_members.role_in_home, home_members.can_manage_members,
                       home_members.can_manage_devices, home_members.created_at AS joined_at
                FROM home_members
                JOIN users ON users.id = home_members.user_id
                WHERE home_members.home_id = ?
                ORDER BY home_members.created_at ASC
                """,
                (home_id,),
            ).fetchall()

            return [
                {
                    **self.public_user(row),
                    "roleInHome": row["role_in_home"],
                    "canManageMembers": bool(row["can_manage_members"]),
                    "canManageDevices": bool(row["can_manage_devices"]),
                    "joinedAt": row["joined_at"],
                }
                for row in rows
            ]

    def list_admin_homes(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT homes.*, users.name AS owner_name, users.username AS owner_username,
                       COALESCE(member_stats.member_count, 0) AS member_count,
                       COALESCE(room_stats.room_count, 0) AS room_count,
                       COALESCE(device_stats.device_count, 0) AS device_count,
                       COALESCE(device_stats.total_rated_power_w, 0) AS total_rated_power_w
                FROM homes
                JOIN users ON users.id = homes.owner_id
                LEFT JOIN (
                    SELECT home_id, COUNT(*) AS member_count
                    FROM home_members
                    GROUP BY home_id
                ) AS member_stats ON member_stats.home_id = homes.id
                LEFT JOIN (
                    SELECT home_id, COUNT(*) AS room_count
                    FROM rooms
                    GROUP BY home_id
                ) AS room_stats ON room_stats.home_id = homes.id
                LEFT JOIN (
                    SELECT home_id, COUNT(*) AS device_count, SUM(rated_power_w) AS total_rated_power_w
                    FROM devices
                    GROUP BY home_id
                ) AS device_stats ON device_stats.home_id = homes.id
                ORDER BY homes.created_at DESC
                """
            ).fetchall()

            return [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "ownerId": row["owner_id"],
                    "ownerName": row["owner_name"],
                    "ownerUsername": row["owner_username"],
                    "status": row["status"],
                    "memberCount": row["member_count"],
                    "roomCount": row["room_count"],
                    "deviceCount": row["device_count"],
                    "totalRatedPowerW": row["total_rated_power_w"],
                    "createdAt": row["created_at"],
                }
                for row in rows
            ]

    def list_collector_homes(self, home_ids: list[str] | None = None) -> list[dict[str, Any]]:
        clauses = ["status = 'active'"]
        params: list[Any] = []
        if home_ids:
            placeholders = ",".join("?" for _ in home_ids)
            clauses.append(f"id IN ({placeholders})")
            params.extend(home_ids)

        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT id, name, owner_id, status, created_at
                FROM homes
                WHERE {' AND '.join(clauses)}
                ORDER BY created_at ASC
                """,
                params,
            ).fetchall()

            return [
                {
                    "id": row["id"],
                    "name": row["name"],
                    "ownerId": row["owner_id"],
                    "status": row["status"],
                    "createdAt": row["created_at"],
                }
                for row in rows
            ]

    def list_admin_users(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT users.*,
                       GROUP_CONCAT(home_members.home_id) AS home_ids
                FROM users
                LEFT JOIN home_members ON home_members.user_id = users.id
                GROUP BY users.id
                ORDER BY users.created_at DESC
                """
            ).fetchall()

            result: list[dict[str, Any]] = []
            for row in rows:
                user = self.public_user(row)
                user["homeIds"] = [item for item in str(row["home_ids"] or "").split(",") if item]
                result.append(user)
            return result

    def create_owner_with_home(
        self,
        *,
        owner_name: str,
        username: str,
        phone: str | None,
        password: str,
        home_name: str,
    ) -> dict[str, Any]:
        now = utc_now()
        user_id = f"owner-{secrets.token_hex(8)}"
        home_id = f"home-{secrets.token_hex(8)}"
        member_id = f"member-link-{secrets.token_hex(8)}"

        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO users (id, username, phone, name, password_hash, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'owner', 'active', ?)
                """,
                (user_id, username, phone or None, owner_name, hash_password(password), now),
            )
            conn.execute(
                """
                INSERT INTO homes (id, name, owner_id, status, energy_limit_kwh, created_at)
                VALUES (?, ?, ?, 'active', ?, ?)
                """,
                (home_id, home_name, user_id, DEFAULT_HOME_ENERGY_LIMIT_KWH, now),
            )
            conn.execute(
                """
                INSERT INTO home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES (?, ?, ?, 'owner', 1, 1, ?)
                """,
                (member_id, home_id, user_id, now),
            )

            user_row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            home_row = conn.execute(
                """
                SELECT homes.*, users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM homes
                JOIN users ON users.id = homes.owner_id
                LEFT JOIN home_members ON home_members.home_id = homes.id
                WHERE homes.id = ?
                GROUP BY homes.id
                """,
                (home_id,),
            ).fetchone()

            return {
                "user": self.public_user(user_row),
                "home": {
                    "id": home_row["id"],
                    "name": home_row["name"],
                    "ownerId": home_row["owner_id"],
                    "ownerName": home_row["owner_name"],
                    "ownerUsername": home_row["owner_username"],
                    "status": home_row["status"],
                    "memberCount": home_row["member_count"],
                    "createdAt": home_row["created_at"],
                },
            }

    def set_user_status(self, user_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                return None
            if row["role"] == "system_admin":
                raise ValueError("Cannot change system admin status")

            conn.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
            if status == "suspended":
                conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

            updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return self.public_user(updated)

    def reset_user_password(self, user_id: str, new_password: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                return None
            if row["role"] == "system_admin":
                raise ValueError("Cannot reset system admin password here")

            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_password(new_password), user_id),
            )
            conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return self.public_user(updated)

    def change_user_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str,
        *,
        keep_token: str | None = None,
    ) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None or row["status"] != "active":
                return None
            if not verify_password(current_password, row["password_hash"]):
                raise ValueError("Current password is incorrect")

            conn.execute(
                "UPDATE users SET password_hash = ? WHERE id = ?",
                (hash_password(new_password), user_id),
            )
            if keep_token:
                conn.execute("DELETE FROM sessions WHERE user_id = ? AND token != ?", (user_id, keep_token))
            else:
                conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
            updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return self.public_user(updated)

    def set_home_status(self, home_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM homes WHERE id = ?", (home_id,)).fetchone()
            if row is None:
                return None

            conn.execute("UPDATE homes SET status = ? WHERE id = ?", (status, home_id))
            updated = conn.execute(
                """
                SELECT homes.*, users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM homes
                JOIN users ON users.id = homes.owner_id
                LEFT JOIN home_members ON home_members.home_id = homes.id
                WHERE homes.id = ?
                GROUP BY homes.id
                """,
                (home_id,),
            ).fetchone()

            return {
                "id": updated["id"],
                "name": updated["name"],
                "ownerId": updated["owner_id"],
                "ownerName": updated["owner_name"],
                "ownerUsername": updated["owner_username"],
                "status": updated["status"],
                "memberCount": updated["member_count"],
                "createdAt": updated["created_at"],
            }

    def create_home_member(
        self,
        *,
        home_id: str,
        name: str,
        username: str,
        phone: str | None,
        password: str,
        role_in_home: str,
        can_manage_members: bool,
        can_manage_devices: bool,
    ) -> dict[str, Any] | None:
        now = utc_now()
        user_id = f"user-{secrets.token_hex(8)}"
        link_id = f"member-link-{secrets.token_hex(8)}"
        app_role = "viewer" if role_in_home == "viewer" else "member"

        with self.connect() as conn:
            home = conn.execute("SELECT * FROM homes WHERE id = ?", (home_id,)).fetchone()
            if home is None:
                return None

            conn.execute(
                """
                INSERT INTO users (id, username, phone, name, password_hash, role, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
                """,
                (user_id, username, phone or None, name, hash_password(password), app_role, now),
            )
            conn.execute(
                """
                INSERT INTO home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    link_id,
                    home_id,
                    user_id,
                    role_in_home,
                    1 if can_manage_members else 0,
                    1 if can_manage_devices else 0,
                    now,
                ),
            )

            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home, home_members.can_manage_members,
                       home_members.can_manage_devices, home_members.created_at AS joined_at
                FROM users
                JOIN home_members ON home_members.user_id = users.id
                WHERE users.id = ? AND home_members.home_id = ?
                """,
                (user_id, home_id),
            ).fetchone()

            return {
                **self.public_user(row),
                "roleInHome": row["role_in_home"],
                "canManageMembers": bool(row["can_manage_members"]),
                "canManageDevices": bool(row["can_manage_devices"]),
                "joinedAt": row["joined_at"],
            }

    def set_home_member_status(self, home_id: str, user_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home
                FROM users
                JOIN home_members ON home_members.user_id = users.id
                WHERE users.id = ? AND home_members.home_id = ?
                """,
                (user_id, home_id),
            ).fetchone()
            if row is None:
                return None
            if row["role_in_home"] == "owner":
                raise ValueError("Cannot change owner status from member management")

            conn.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
            if status == "suspended":
                conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

            updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            return self.public_user(updated)

    def remove_home_member(self, home_id: str, user_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home
                FROM users
                JOIN home_members ON home_members.user_id = users.id
                WHERE users.id = ? AND home_members.home_id = ?
                """,
                (user_id, home_id),
            ).fetchone()
            if row is None:
                return None
            if row["role_in_home"] == "owner":
                raise ValueError("Cannot remove the home owner")

            public = self.public_user(row)
            conn.execute("DELETE FROM home_members WHERE home_id = ? AND user_id = ?", (home_id, user_id))
            remaining = conn.execute("SELECT COUNT(*) AS count FROM home_members WHERE user_id = ?", (user_id,)).fetchone()
            if remaining["count"] == 0:
                conn.execute("UPDATE users SET status = 'suspended' WHERE id = ?", (user_id,))
                conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))

            return public

    def record_audit_log(
        self,
        *,
        actor: dict[str, Any] | None,
        action: str,
        target_type: str | None = None,
        target_id: str | None = None,
        target_name: str | None = None,
        home_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        actor = actor or {}
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO audit_logs (
                    id, actor_user_id, actor_username, actor_role, action,
                    target_type, target_id, target_name, home_id,
                    ip_address, user_agent, metadata_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"audit-{secrets.token_hex(12)}",
                    actor.get("id"),
                    actor.get("username") or actor.get("name"),
                    actor.get("role"),
                    action,
                    target_type,
                    target_id,
                    target_name,
                    home_id,
                    ip_address,
                    user_agent,
                    json.dumps(metadata or {}, ensure_ascii=False),
                    utc_now(),
                ),
            )

    def list_audit_logs(self, limit: int = 100) -> list[dict[str, Any]]:
        safe_limit = min(max(limit, 1), 500)
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM audit_logs
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()

            return [
                {
                    "id": row["id"],
                    "actorUserId": row["actor_user_id"],
                    "actorUsername": row["actor_username"],
                    "actorRole": row["actor_role"],
                    "action": row["action"],
                    "targetType": row["target_type"],
                    "targetId": row["target_id"],
                    "targetName": row["target_name"],
                    "homeId": row["home_id"],
                    "ipAddress": row["ip_address"],
                    "userAgent": row["user_agent"],
                    "metadata": json.loads(row["metadata_json"] or "{}"),
                    "createdAt": row["created_at"],
                }
                for row in rows
            ]

    def list_home_audit_logs(self, home_id: str, limit: int = 100) -> list[dict[str, Any]]:
        safe_limit = min(max(limit, 1), 500)
        with self.connect() as conn:
            member_rows = conn.execute(
                """
                SELECT users.id, users.username, users.phone
                FROM home_members
                JOIN users ON users.id = home_members.user_id
                WHERE home_members.home_id = ?
                """,
                (home_id,),
            ).fetchall()

            member_ids = [str(row["id"]) for row in member_rows if row["id"]]
            member_names = [
                str(value)
                for row in member_rows
                for value in (row["username"], row["phone"])
                if value
            ]

            clauses = ["home_id = ?"]
            params: list[Any] = [home_id]

            if member_ids:
                placeholders = ", ".join("?" for _ in member_ids)
                clauses.append(f"(action = 'auth.login_success' AND actor_user_id IN ({placeholders}))")
                params.extend(member_ids)

            if member_names:
                placeholders = ", ".join("?" for _ in member_names)
                clauses.append(f"(action = 'auth.login_failed' AND target_name IN ({placeholders}))")
                params.extend(member_names)

            params.append(safe_limit)
            rows = conn.execute(
                f"""
                SELECT * FROM audit_logs
                WHERE {' OR '.join(f'({clause})' for clause in clauses)}
                ORDER BY created_at DESC
                LIMIT ?
                """,
                params,
            ).fetchall()

            logs: list[dict[str, Any]] = []
            for row in rows:
                try:
                    metadata = json.loads(row["metadata_json"] or "{}")
                except json.JSONDecodeError:
                    metadata = {}
                logs.append(
                    {
                        "id": row["id"],
                        "actorUserId": row["actor_user_id"],
                        "actorUsername": row["actor_username"],
                        "actorRole": row["actor_role"],
                        "action": row["action"],
                        "targetType": row["target_type"],
                        "targetId": row["target_id"],
                        "targetName": row["target_name"],
                        "homeId": row["home_id"],
                        "ipAddress": row["ip_address"],
                        "userAgent": row["user_agent"],
                        "metadata": metadata,
                        "createdAt": row["created_at"],
                    }
                )
            return logs

    def record_power_reading(
        self,
        *,
        home_id: str,
        timestamp: str,
        voltage: float | None,
        current: float | None,
        power_kw: float | None,
        energy_kwh: float | None,
        source: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        reading_id = f"power-{secrets.token_hex(12)}"
        created_at = utc_now()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO power_readings (
                    id, home_id, timestamp, voltage, current, power_kw,
                    energy_kwh, source, metadata_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reading_id,
                    home_id,
                    timestamp,
                    voltage,
                    current,
                    power_kw,
                    energy_kwh,
                    source,
                    json.dumps(metadata or {}, ensure_ascii=False),
                    created_at,
                ),
            )

        return {
            "id": reading_id,
            "homeId": home_id,
            "timestamp": timestamp,
            "voltage": voltage,
            "current": current,
            "power_kw": power_kw,
            "energy_kwh": energy_kwh,
            "source": source,
            "metadata": metadata or {},
            "createdAt": created_at,
        }

    def list_power_readings(
        self,
        *,
        home_id: str,
        limit: int = 288,
        start: str | None = None,
        end: str | None = None,
    ) -> list[dict[str, Any]]:
        safe_limit = min(max(limit, 1), 5000)
        clauses = ["home_id = ?"]
        params: list[Any] = [home_id]

        if start:
            clauses.append("timestamp >= ?")
            params.append(start)
        if end:
            clauses.append("timestamp <= ?")
            params.append(end)

        params.append(safe_limit)
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM power_readings
                WHERE {' AND '.join(clauses)}
                ORDER BY timestamp DESC
                LIMIT ?
                """,
                params,
            ).fetchall()

        readings: list[dict[str, Any]] = []
        for row in reversed(rows):
            try:
                metadata = json.loads(row["metadata_json"] or "{}")
            except json.JSONDecodeError:
                metadata = {}
            readings.append(
                {
                    "id": row["id"],
                    "homeId": row["home_id"],
                    "timestamp": row["timestamp"],
                    "voltage": row["voltage"],
                    "current": row["current"],
                    "power_kw": row["power_kw"],
                    "energy_kwh": row["energy_kwh"],
                    "source": row["source"],
                    "metadata": metadata,
                    "createdAt": row["created_at"],
                }
            )
        return readings

    def list_power_readings_hourly(
        self,
        *,
        home_id: str,
        limit: int = 1000,
    ) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT 
                    strftime('%Y-%m-%dT%H:00:00', replace(timestamp, 'T', ' ')) as hourly_time,
                    AVG(voltage) as avg_voltage,
                    AVG(current) as avg_current,
                    AVG(power_kw) as avg_power_kw,
                    AVG(energy_kwh) as avg_energy_kwh
                FROM power_readings
                WHERE home_id = ?
                GROUP BY hourly_time
                ORDER BY hourly_time DESC
                LIMIT ?
                """,
                [home_id, limit]
            ).fetchall()
        
        readings = []
        for row in reversed(rows):
            if not row["hourly_time"]:
                continue
            readings.append({
                "id": f"hourly-{row['hourly_time']}",
                "homeId": home_id,
                "timestamp": row["hourly_time"],
                "voltage": row["avg_voltage"],
                "current": row["avg_current"],
                "power_kw": row["avg_power_kw"],
                "energy_kwh": row["avg_energy_kwh"],
                "source": "server_hourly_agg",
                "createdAt": row["hourly_time"],
            })
        return readings


    @staticmethod
    def _json_obj(value: str | None) -> dict[str, Any]:
        try:
            return json.loads(value or "{}")
        except json.JSONDecodeError:
            return {}

    @classmethod
    def public_room(cls, row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "homeId": row["home_id"],
            "name": row["name"],
            "type": row["type"],
            "sortOrder": row["sort_order"],
            "metadata": cls._json_obj(row["metadata_json"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    @classmethod
    def public_device(cls, row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "homeId": row["home_id"],
            "roomId": row["room_id"],
            "name": row["name"],
            "type": row["type"],
            "status": row["status"],
            "ratedPowerW": row["rated_power_w"],
            "isControllable": bool(row["is_controllable"]),
            "plcStatusTag": row["plc_status_tag"],
            "plcOnCommandTag": row["plc_on_command_tag"],
            "plcOffCommandTag": row["plc_off_command_tag"],
            "metadata": cls._json_obj(row["metadata_json"]),
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
        }

    def list_rooms(self, home_id: str) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM rooms
                WHERE home_id = ?
                ORDER BY sort_order ASC, name ASC
                """,
                (home_id,),
            ).fetchall()
            return [self.public_room(row) for row in rows]

    def create_room(
        self,
        *,
        home_id: str,
        name: str,
        room_type: str = "room",
        sort_order: int = 0,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        now = utc_now()
        room_id = f"room-{secrets.token_hex(8)}"
        with self.connect() as conn:
            home = conn.execute("SELECT id FROM homes WHERE id = ?", (home_id,)).fetchone()
            if home is None:
                return None
            conn.execute(
                """
                INSERT INTO rooms (id, home_id, name, type, sort_order, metadata_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (room_id, home_id, name, room_type, sort_order, json.dumps(metadata or {}, ensure_ascii=False), now, now),
            )
            row = conn.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
            return self.public_room(row)

    def update_room(
        self,
        *,
        home_id: str,
        room_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any] | None:
        allowed = {
            "name": "name",
            "type": "type",
            "sortOrder": "sort_order",
            "metadata": "metadata_json",
        }
        fields: list[str] = []
        params: list[Any] = []
        for key, column in allowed.items():
            if key not in updates:
                continue
            value = updates[key]
            if key == "metadata":
                value = json.dumps(value or {}, ensure_ascii=False)
            fields.append(f"{column} = ?")
            params.append(value)

        with self.connect() as conn:
            current = conn.execute("SELECT * FROM rooms WHERE id = ? AND home_id = ?", (room_id, home_id)).fetchone()
            if current is None:
                return None
            if fields:
                fields.append("updated_at = ?")
                params.append(utc_now())
                params.extend([room_id, home_id])
                conn.execute(f"UPDATE rooms SET {', '.join(fields)} WHERE id = ? AND home_id = ?", params)
            row = conn.execute("SELECT * FROM rooms WHERE id = ? AND home_id = ?", (room_id, home_id)).fetchone()
            return self.public_room(row)

    def delete_room(self, home_id: str, room_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM rooms WHERE id = ? AND home_id = ?", (room_id, home_id)).fetchone()
            if row is None:
                return None
            room = self.public_room(row)
            conn.execute("DELETE FROM rooms WHERE id = ? AND home_id = ?", (room_id, home_id))
            return room

    def list_manual_devices(self, home_id: str, room_id: str | None = None) -> list[dict[str, Any]]:
        clauses = ["home_id = ?"]
        params: list[Any] = [home_id]
        if room_id:
            clauses.append("room_id = ?")
            params.append(room_id)

        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM devices
                WHERE {' AND '.join(clauses)}
                ORDER BY name ASC
                """,
                params,
            ).fetchall()
            return [self.public_device(row) for row in rows]

    def create_manual_device(
        self,
        *,
        home_id: str,
        room_id: str | None,
        name: str,
        device_type: str,
        status: str = "unknown",
        rated_power_w: float = 0.0,
        is_controllable: bool = True,
        plc_status_tag: str | None = None,
        plc_on_command_tag: str | None = None,
        plc_off_command_tag: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        now = utc_now()
        device_id = f"device-{secrets.token_hex(8)}"
        with self.connect() as conn:
            home = conn.execute("SELECT id FROM homes WHERE id = ?", (home_id,)).fetchone()
            if home is None:
                return None
            if room_id:
                room = conn.execute("SELECT id FROM rooms WHERE id = ? AND home_id = ?", (room_id, home_id)).fetchone()
                if room is None:
                    raise ValueError("Room not found in this home")

            conn.execute(
                """
                INSERT INTO devices (
                    id, home_id, room_id, name, type, status, rated_power_w,
                    is_controllable, plc_status_tag, plc_on_command_tag, plc_off_command_tag,
                    metadata_json, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    device_id,
                    home_id,
                    room_id,
                    name,
                    device_type,
                    status,
                    rated_power_w,
                    1 if is_controllable else 0,
                    plc_status_tag,
                    plc_on_command_tag,
                    plc_off_command_tag,
                    json.dumps(metadata or {}, ensure_ascii=False),
                    now,
                    now,
                ),
            )
            row = conn.execute("SELECT * FROM devices WHERE id = ?", (device_id,)).fetchone()
            return self.public_device(row)

    def update_manual_device(
        self,
        *,
        home_id: str,
        device_id: str,
        updates: dict[str, Any],
    ) -> dict[str, Any] | None:
        allowed = {
            "roomId": "room_id",
            "name": "name",
            "type": "type",
            "status": "status",
            "ratedPowerW": "rated_power_w",
            "isControllable": "is_controllable",
            "plcStatusTag": "plc_status_tag",
            "plcOnCommandTag": "plc_on_command_tag",
            "plcOffCommandTag": "plc_off_command_tag",
            "metadata": "metadata_json",
        }
        fields: list[str] = []
        params: list[Any] = []

        with self.connect() as conn:
            current = conn.execute("SELECT * FROM devices WHERE id = ? AND home_id = ?", (device_id, home_id)).fetchone()
            if current is None:
                return None
            if "roomId" in updates and updates["roomId"]:
                room = conn.execute("SELECT id FROM rooms WHERE id = ? AND home_id = ?", (updates["roomId"], home_id)).fetchone()
                if room is None:
                    raise ValueError("Room not found in this home")

            for key, column in allowed.items():
                if key not in updates:
                    continue
                value = updates[key]
                if key == "metadata":
                    value = json.dumps(value or {}, ensure_ascii=False)
                if key == "isControllable":
                    value = 1 if value else 0
                fields.append(f"{column} = ?")
                params.append(value)

            if fields:
                fields.append("updated_at = ?")
                params.append(utc_now())
                params.extend([device_id, home_id])
                conn.execute(f"UPDATE devices SET {', '.join(fields)} WHERE id = ? AND home_id = ?", params)

            row = conn.execute("SELECT * FROM devices WHERE id = ? AND home_id = ?", (device_id, home_id)).fetchone()
            return self.public_device(row)

    def delete_manual_device(self, home_id: str, device_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM devices WHERE id = ? AND home_id = ?", (device_id, home_id)).fetchone()
            if row is None:
                return None
            device = self.public_device(row)
            conn.execute("DELETE FROM devices WHERE id = ? AND home_id = ?", (device_id, home_id))
            return device

    def record_device_event(
        self,
        *,
        home_id: str,
        room_id: str | None,
        device_id: str | None,
        actor_user_id: str | None,
        event_type: str,
        source: str = "manual",
        value: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        event_id = f"device-event-{secrets.token_hex(12)}"
        created_at = utc_now()
        with self.connect() as conn:
            conn.execute(
                """
                INSERT INTO device_events (
                    id, home_id, room_id, device_id, actor_user_id, event_type,
                    source, value_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    home_id,
                    room_id,
                    device_id,
                    actor_user_id,
                    event_type,
                    source,
                    json.dumps(value or {}, ensure_ascii=False),
                    created_at,
                ),
            )
        return {
            "id": event_id,
            "homeId": home_id,
            "roomId": room_id,
            "deviceId": device_id,
            "actorUserId": actor_user_id,
            "eventType": event_type,
            "source": source,
            "value": value or {},
            "createdAt": created_at,
        }

    def get_home_quota_status(self, home_id: str) -> dict[str, Any]:
        with self.connect() as conn:
            row = conn.execute("SELECT energy_limit_kwh FROM homes WHERE id = ?", (home_id,)).fetchone()
            limit = float(row["energy_limit_kwh"]) if row and row["energy_limit_kwh"] is not None else DEFAULT_HOME_ENERGY_LIMIT_KWH

        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()

        with self.connect() as conn:
            plc_count = conn.execute(
                """
                SELECT COUNT(*) AS count
                FROM power_readings
                WHERE home_id = ?
                  AND timestamp >= ?
                  AND energy_kwh IS NOT NULL
                  AND energy_kwh >= 0
                  AND energy_kwh <= 1000000
                  AND source LIKE 'plc-s7-1200%'
                """,
                (home_id, start_of_month),
            ).fetchone()["count"]
            source_filter = "AND source LIKE 'plc-s7-1200%'" if plc_count else ""
            source_name = "plc-s7-1200" if plc_count else "all"
            readings_row = conn.execute(
                f"""
                SELECT MIN(energy_kwh) AS min_energy, MAX(energy_kwh) AS max_energy
                FROM power_readings
                WHERE home_id = ?
                  AND timestamp >= ?
                  AND energy_kwh IS NOT NULL
                  AND energy_kwh >= 0
                  AND energy_kwh <= 1000000
                  {source_filter}
                """,
                (home_id, start_of_month),
            ).fetchone()

            min_energy = readings_row["min_energy"] if readings_row else None
            max_energy = readings_row["max_energy"] if readings_row else None

            if min_energy is not None and max_energy is not None:
                current_usage = max(0.0, float(max_energy) - float(min_energy))
            else:
                current_usage = 0.0

        return {
            "homeId": home_id,
            "energyLimitKwh": limit,
            "currentMonthEnergyKwh": round(current_usage, 2),
            "quotaSource": source_name,
        }

    def update_home_quota(self, home_id: str, limit: float) -> bool:
        with self.connect() as conn:
            cursor = conn.execute(
                "UPDATE homes SET energy_limit_kwh = ? WHERE id = ?",
                (limit, home_id),
            )
            return cursor.rowcount > 0
