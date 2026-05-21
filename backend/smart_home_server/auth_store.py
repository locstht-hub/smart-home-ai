from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


SESSION_DAYS = 30


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

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

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

                CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_home ON audit_logs(home_id);
                """
            )
            self.seed_defaults(conn)

    def seed_defaults(self, conn: sqlite3.Connection) -> None:
        count = conn.execute("SELECT COUNT(*) AS count FROM users").fetchone()["count"]
        if count:
            return

        now = utc_now()
        users = [
            ("system-admin-001", "admin", "0123456789", "System Admin", "admin123", "system_admin"),
            ("owner-demo-001", "owner", "0900000001", "Chủ nhà mẫu", "owner123", "owner"),
            ("member-demo-001", "member", "0900000002", "Thành viên mẫu", "member123", "member"),
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
            VALUES ('member-link-member-001', 'home-demo-001', 'member-demo-001', 'member', 0, 0, ?)
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

    def list_admin_homes(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT homes.*, users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM homes
                JOIN users ON users.id = homes.owner_id
                LEFT JOIN home_members ON home_members.home_id = homes.id
                GROUP BY homes.id
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
                    "createdAt": row["created_at"],
                }
                for row in rows
            ]

    def list_admin_users(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
            return [self.public_user(row) for row in rows]

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
