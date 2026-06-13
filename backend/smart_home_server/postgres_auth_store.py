from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import psycopg
from psycopg.rows import dict_row

from auth_store import DEFAULT_HOME_ENERGY_LIMIT_KWH, SESSION_DAYS, hash_password, utc_now, verify_password


def iso_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def parse_metadata(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if not value:
        return {}
    try:
        return json.loads(str(value))
    except json.JSONDecodeError:
        return {}


class PostgresAuthStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url
        self.seed_defaults()

    def connect(self) -> psycopg.Connection[Any]:
        return psycopg.connect(self.database_url, row_factory=dict_row)

    @staticmethod
    def public_user(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "username": row["username"],
            "phone": row["phone"],
            "name": row["name"],
            "role": row["role"],
            "status": row["status"],
            "createdAt": iso_value(row["created_at"]),
            "lastActive": iso_value(row["last_active"]),
        }

    def seed_defaults(self) -> None:
        with self.connect() as conn:
            row = conn.execute("SELECT COUNT(*) AS count FROM public.users").fetchone()
            if row and int(row["count"]):
                return

            now = utc_now()
            users = [
                ("system-admin-001", "admin", "0123456789", "System Admin", "admin123", "system_admin"),
                ("owner-demo-001", "owner", "0900000001", "Chu nha mau", "owner123", "owner"),
                ("member-demo-001", "member", "0900000002", "Thanh vien mau", "member123", "member"),
            ]

            for user_id, username, phone, name, password, role in users:
                conn.execute(
                    """
                    INSERT INTO public.users (id, username, phone, name, password_hash, role, status, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, 'active', %s)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    (user_id, username, phone, name, hash_password(password), role, now),
                )

            conn.execute(
                """
                INSERT INTO public.homes (id, name, owner_id, status, energy_limit_kwh, created_at)
                VALUES ('home-demo-001', 'Nha mau Smart Home AI', 'owner-demo-001', 'active', %s, %s)
                ON CONFLICT (id) DO NOTHING
                """,
                (DEFAULT_HOME_ENERGY_LIMIT_KWH, now),
            )
            conn.execute(
                """
                INSERT INTO public.home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES ('member-link-owner-001', 'home-demo-001', 'owner-demo-001', 'owner', true, true, %s)
                ON CONFLICT (home_id, user_id) DO NOTHING
                """,
                (now,),
            )
            conn.execute(
                """
                INSERT INTO public.home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES ('member-link-member-001', 'home-demo-001', 'member-demo-001', 'member', false, false, %s)
                ON CONFLICT (home_id, user_id) DO NOTHING
                """,
                (now,),
            )

    def login(self, username_or_phone: str, password: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT * FROM public.users
                WHERE lower(username) = lower(%s) OR phone = %s
                """,
                (username_or_phone, username_or_phone),
            ).fetchone()

            if row is None or row["status"] != "active" or not verify_password(password, row["password_hash"]):
                return None

            token = secrets.token_urlsafe(32)
            now_dt = datetime.now(timezone.utc)
            expires_at = (now_dt + timedelta(days=SESSION_DAYS)).isoformat()
            conn.execute(
                "INSERT INTO public.sessions (token, user_id, created_at, expires_at) VALUES (%s, %s, %s, %s)",
                (token, row["id"], now_dt.isoformat(), expires_at),
            )
            conn.execute("UPDATE public.users SET last_active = %s WHERE id = %s", (now_dt.isoformat(), row["id"]))

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
                FROM public.sessions
                JOIN public.users ON users.id = sessions.user_id
                WHERE sessions.token = %s AND sessions.expires_at > %s
                """,
                (token, utc_now()),
            ).fetchone()

            return self.public_user(row) if row else None

    def list_user_homes(self, conn: psycopg.Connection[Any], user_id: str) -> list[dict[str, Any]]:
        rows = conn.execute(
            """
            SELECT homes.*, home_members.role_in_home, home_members.can_manage_members, home_members.can_manage_devices
            FROM public.home_members
            JOIN public.homes ON homes.id = home_members.home_id
            WHERE home_members.user_id = %s
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
                "createdAt": iso_value(row["created_at"]),
                "roleInHome": row["role_in_home"],
                "canManageMembers": bool(row["can_manage_members"]),
                "canManageDevices": bool(row["can_manage_devices"]),
            }
            for row in rows
        ]

    def get_me(self, user_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
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
                    FROM public.home_members
                    JOIN public.homes ON homes.id = home_members.home_id
                    WHERE home_members.user_id = %s AND homes.id = %s
                    """,
                    (user_id, home_id),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT homes.*, home_members.role_in_home,
                           home_members.can_manage_members, home_members.can_manage_devices
                    FROM public.home_members
                    JOIN public.homes ON homes.id = home_members.home_id
                    WHERE home_members.user_id = %s
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
                "createdAt": iso_value(row["created_at"]),
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
                FROM public.home_members
                JOIN public.users ON users.id = home_members.user_id
                WHERE home_members.home_id = %s
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
                    "joinedAt": iso_value(row["joined_at"]),
                }
                for row in rows
            ]

    def list_admin_homes(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                       users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM public.homes
                JOIN public.users ON users.id = homes.owner_id
                LEFT JOIN public.home_members ON home_members.home_id = homes.id
                GROUP BY homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                         users.name, users.username
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
                    "createdAt": iso_value(row["created_at"]),
                }
                for row in rows
            ]

    def list_collector_homes(self, home_ids: list[str] | None = None) -> list[dict[str, Any]]:
        clauses = ["status = 'active'"]
        params: list[Any] = []
        if home_ids:
            clauses.append("id = ANY(%s)")
            params.append(home_ids)

        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT id, name, owner_id, status, created_at
                FROM public.homes
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
                    "createdAt": iso_value(row["created_at"]),
                }
                for row in rows
            ]

    def list_admin_users(self) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT users.*,
                       COALESCE(array_remove(array_agg(home_members.home_id), NULL), ARRAY[]::text[]) AS home_ids
                FROM public.users
                LEFT JOIN public.home_members ON home_members.user_id = users.id
                GROUP BY users.id, users.username, users.phone, users.name, users.password_hash,
                         users.role, users.status, users.created_at, users.last_active
                ORDER BY users.created_at DESC
                """
            ).fetchall()

            result: list[dict[str, Any]] = []
            for row in rows:
                user = self.public_user(row)
                user["homeIds"] = list(row["home_ids"] or [])
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
                INSERT INTO public.users (id, username, phone, name, password_hash, role, status, created_at)
                VALUES (%s, %s, %s, %s, %s, 'owner', 'active', %s)
                """,
                (user_id, username, phone or None, owner_name, hash_password(password), now),
            )
            conn.execute(
                """
                INSERT INTO public.homes (id, name, owner_id, status, energy_limit_kwh, created_at)
                VALUES (%s, %s, %s, 'active', %s, %s)
                """,
                (home_id, home_name, user_id, DEFAULT_HOME_ENERGY_LIMIT_KWH, now),
            )
            conn.execute(
                """
                INSERT INTO public.home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES (%s, %s, %s, 'owner', true, true, %s)
                """,
                (member_id, home_id, user_id, now),
            )

            user_row = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            home_row = conn.execute(
                """
                SELECT homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                       users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM public.homes
                JOIN public.users ON users.id = homes.owner_id
                LEFT JOIN public.home_members ON home_members.home_id = homes.id
                WHERE homes.id = %s
                GROUP BY homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                         users.name, users.username
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
                    "createdAt": iso_value(home_row["created_at"]),
                },
            }

    def set_user_status(self, user_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            if row is None:
                return None
            if row["role"] == "system_admin":
                raise ValueError("Cannot change system admin status")

            conn.execute("UPDATE public.users SET status = %s WHERE id = %s", (status, user_id))
            if status == "suspended":
                conn.execute("DELETE FROM public.sessions WHERE user_id = %s", (user_id,))

            updated = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            return self.public_user(updated)

    def reset_user_password(self, user_id: str, new_password: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            if row is None:
                return None
            if row["role"] == "system_admin":
                raise ValueError("Cannot reset system admin password here")

            conn.execute(
                "UPDATE public.users SET password_hash = %s WHERE id = %s",
                (hash_password(new_password), user_id),
            )
            conn.execute("DELETE FROM public.sessions WHERE user_id = %s", (user_id,))
            updated = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
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
            row = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            if row is None or row["status"] != "active":
                return None
            if not verify_password(current_password, row["password_hash"]):
                raise ValueError("Current password is incorrect")

            conn.execute(
                "UPDATE public.users SET password_hash = %s WHERE id = %s",
                (hash_password(new_password), user_id),
            )
            if keep_token:
                conn.execute("DELETE FROM public.sessions WHERE user_id = %s AND token != %s", (user_id, keep_token))
            else:
                conn.execute("DELETE FROM public.sessions WHERE user_id = %s", (user_id,))
            updated = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            return self.public_user(updated)

    def set_home_status(self, home_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute("SELECT * FROM public.homes WHERE id = %s", (home_id,)).fetchone()
            if row is None:
                return None

            conn.execute("UPDATE public.homes SET status = %s WHERE id = %s", (status, home_id))
            updated = conn.execute(
                """
                SELECT homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                       users.name AS owner_name, users.username AS owner_username,
                       COUNT(home_members.user_id) AS member_count
                FROM public.homes
                JOIN public.users ON users.id = homes.owner_id
                LEFT JOIN public.home_members ON home_members.home_id = homes.id
                WHERE homes.id = %s
                GROUP BY homes.id, homes.name, homes.owner_id, homes.status, homes.created_at,
                         users.name, users.username
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
                "createdAt": iso_value(updated["created_at"]),
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
            home = conn.execute("SELECT * FROM public.homes WHERE id = %s", (home_id,)).fetchone()
            if home is None:
                return None

            conn.execute(
                """
                INSERT INTO public.users (id, username, phone, name, password_hash, role, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, 'active', %s)
                """,
                (user_id, username, phone or None, name, hash_password(password), app_role, now),
            )
            conn.execute(
                """
                INSERT INTO public.home_members (
                    id, home_id, user_id, role_in_home,
                    can_manage_members, can_manage_devices, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (link_id, home_id, user_id, role_in_home, can_manage_members, can_manage_devices, now),
            )

            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home, home_members.can_manage_members,
                       home_members.can_manage_devices, home_members.created_at AS joined_at
                FROM public.users
                JOIN public.home_members ON home_members.user_id = users.id
                WHERE users.id = %s AND home_members.home_id = %s
                """,
                (user_id, home_id),
            ).fetchone()

            return {
                **self.public_user(row),
                "roleInHome": row["role_in_home"],
                "canManageMembers": bool(row["can_manage_members"]),
                "canManageDevices": bool(row["can_manage_devices"]),
                "joinedAt": iso_value(row["joined_at"]),
            }

    def set_home_member_status(self, home_id: str, user_id: str, status: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home
                FROM public.users
                JOIN public.home_members ON home_members.user_id = users.id
                WHERE users.id = %s AND home_members.home_id = %s
                """,
                (user_id, home_id),
            ).fetchone()
            if row is None:
                return None
            if row["role_in_home"] == "owner":
                raise ValueError("Cannot change owner status from member management")

            conn.execute("UPDATE public.users SET status = %s WHERE id = %s", (status, user_id))
            if status == "suspended":
                conn.execute("DELETE FROM public.sessions WHERE user_id = %s", (user_id,))

            updated = conn.execute("SELECT * FROM public.users WHERE id = %s", (user_id,)).fetchone()
            return self.public_user(updated)

    def remove_home_member(self, home_id: str, user_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                """
                SELECT users.*, home_members.role_in_home
                FROM public.users
                JOIN public.home_members ON home_members.user_id = users.id
                WHERE users.id = %s AND home_members.home_id = %s
                """,
                (user_id, home_id),
            ).fetchone()
            if row is None:
                return None
            if row["role_in_home"] == "owner":
                raise ValueError("Cannot remove the home owner")

            public = self.public_user(row)
            conn.execute("DELETE FROM public.home_members WHERE home_id = %s AND user_id = %s", (home_id, user_id))
            remaining = conn.execute("SELECT COUNT(*) AS count FROM public.home_members WHERE user_id = %s", (user_id,)).fetchone()
            if remaining and int(remaining["count"]) == 0:
                conn.execute("UPDATE public.users SET status = 'suspended' WHERE id = %s", (user_id,))
                conn.execute("DELETE FROM public.sessions WHERE user_id = %s", (user_id,))

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
                INSERT INTO public.audit_logs (
                    id, actor_user_id, actor_username, actor_role, action,
                    target_type, target_id, target_name, home_id,
                    ip_address, user_agent, metadata_json, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                SELECT * FROM public.audit_logs
                ORDER BY created_at DESC
                LIMIT %s
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
                    "metadata": parse_metadata(row["metadata_json"]),
                    "createdAt": iso_value(row["created_at"]),
                }
                for row in rows
            ]

    def list_home_audit_logs(self, home_id: str, limit: int = 100) -> list[dict[str, Any]]:
        safe_limit = min(max(limit, 1), 500)
        with self.connect() as conn:
            member_rows = conn.execute(
                """
                SELECT users.id, users.username, users.phone
                FROM public.home_members
                JOIN public.users ON users.id = home_members.user_id
                WHERE home_members.home_id = %s
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

            clauses = ["home_id = %s"]
            params: list[Any] = [home_id]

            if member_ids:
                clauses.append("(action = 'auth.login_success' AND actor_user_id = ANY(%s))")
                params.append(member_ids)

            if member_names:
                clauses.append("(action = 'auth.login_failed' AND target_name = ANY(%s))")
                params.append(member_names)

            params.append(safe_limit)
            rows = conn.execute(
                f"""
                SELECT * FROM public.audit_logs
                WHERE {' OR '.join(f'({clause})' for clause in clauses)}
                ORDER BY created_at DESC
                LIMIT %s
                """,
                params,
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
                    "metadata": parse_metadata(row["metadata_json"]),
                    "createdAt": iso_value(row["created_at"]),
                }
                for row in rows
            ]

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
                INSERT INTO public.power_readings (
                    id, home_id, timestamp, voltage, current, power_kw,
                    energy_kwh, source, metadata_json, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (reading_id, home_id, timestamp, voltage, current, power_kw, energy_kwh, source, json.dumps(metadata or {}, ensure_ascii=False), created_at),
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
        clauses = ["home_id = %s"]
        params: list[Any] = [home_id]

        if start:
            clauses.append("timestamp >= %s")
            params.append(start)
        if end:
            clauses.append("timestamp <= %s")
            params.append(end)

        params.append(safe_limit)
        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM public.power_readings
                WHERE {' AND '.join(clauses)}
                ORDER BY timestamp DESC
                LIMIT %s
                """,
                params,
            ).fetchall()

        readings: list[dict[str, Any]] = []
        for row in reversed(rows):
            readings.append(
                {
                    "id": row["id"],
                    "homeId": row["home_id"],
                    "timestamp": iso_value(row["timestamp"]),
                    "voltage": row["voltage"],
                    "current": row["current"],
                    "power_kw": row["power_kw"],
                    "energy_kwh": row["energy_kwh"],
                    "source": row["source"],
                    "metadata": parse_metadata(row["metadata_json"]),
                    "createdAt": iso_value(row["created_at"]),
                }
            )
        return readings

    @staticmethod
    def public_room(row: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": row["id"],
            "homeId": row["home_id"],
            "name": row["name"],
            "type": row["type"],
            "sortOrder": row["sort_order"],
            "metadata": parse_metadata(row["metadata_json"]),
            "createdAt": iso_value(row["created_at"]),
            "updatedAt": iso_value(row["updated_at"]),
        }

    @staticmethod
    def public_device(row: dict[str, Any]) -> dict[str, Any]:
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
            "metadata": parse_metadata(row["metadata_json"]),
            "createdAt": iso_value(row["created_at"]),
            "updatedAt": iso_value(row["updated_at"]),
        }

    def list_rooms(self, home_id: str) -> list[dict[str, Any]]:
        with self.connect() as conn:
            rows = conn.execute(
                """
                SELECT * FROM public.rooms
                WHERE home_id = %s
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
            home = conn.execute("SELECT id FROM public.homes WHERE id = %s", (home_id,)).fetchone()
            if home is None:
                return None
            conn.execute(
                """
                INSERT INTO public.rooms (id, home_id, name, type, sort_order, metadata_json, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (room_id, home_id, name, room_type, sort_order, json.dumps(metadata or {}, ensure_ascii=False), now, now),
            )
            row = conn.execute("SELECT * FROM public.rooms WHERE id = %s", (room_id,)).fetchone()
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
            fields.append(f"{column} = %s")
            params.append(value)

        with self.connect() as conn:
            current = conn.execute(
                "SELECT * FROM public.rooms WHERE id = %s AND home_id = %s",
                (room_id, home_id),
            ).fetchone()
            if current is None:
                return None
            if fields:
                fields.append("updated_at = %s")
                params.append(utc_now())
                params.extend([room_id, home_id])
                conn.execute(
                    f"UPDATE public.rooms SET {', '.join(fields)} WHERE id = %s AND home_id = %s",
                    params,
                )
            row = conn.execute(
                "SELECT * FROM public.rooms WHERE id = %s AND home_id = %s",
                (room_id, home_id),
            ).fetchone()
            return self.public_room(row)

    def delete_room(self, home_id: str, room_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM public.rooms WHERE id = %s AND home_id = %s",
                (room_id, home_id),
            ).fetchone()
            if row is None:
                return None
            room = self.public_room(row)
            conn.execute("DELETE FROM public.rooms WHERE id = %s AND home_id = %s", (room_id, home_id))
            return room

    def list_manual_devices(self, home_id: str, room_id: str | None = None) -> list[dict[str, Any]]:
        clauses = ["home_id = %s"]
        params: list[Any] = [home_id]
        if room_id:
            clauses.append("room_id = %s")
            params.append(room_id)

        with self.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM public.devices
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
            home = conn.execute("SELECT id FROM public.homes WHERE id = %s", (home_id,)).fetchone()
            if home is None:
                return None
            if room_id:
                room = conn.execute(
                    "SELECT id FROM public.rooms WHERE id = %s AND home_id = %s",
                    (room_id, home_id),
                ).fetchone()
                if room is None:
                    raise ValueError("Room not found in this home")

            conn.execute(
                """
                INSERT INTO public.devices (
                    id, home_id, room_id, name, type, status, rated_power_w,
                    is_controllable, plc_status_tag, plc_on_command_tag, plc_off_command_tag,
                    metadata_json, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    device_id,
                    home_id,
                    room_id,
                    name,
                    device_type,
                    status,
                    rated_power_w,
                    is_controllable,
                    plc_status_tag,
                    plc_on_command_tag,
                    plc_off_command_tag,
                    json.dumps(metadata or {}, ensure_ascii=False),
                    now,
                    now,
                ),
            )
            row = conn.execute("SELECT * FROM public.devices WHERE id = %s", (device_id,)).fetchone()
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
            current = conn.execute(
                "SELECT * FROM public.devices WHERE id = %s AND home_id = %s",
                (device_id, home_id),
            ).fetchone()
            if current is None:
                return None
            if "roomId" in updates and updates["roomId"]:
                room = conn.execute(
                    "SELECT id FROM public.rooms WHERE id = %s AND home_id = %s",
                    (updates["roomId"], home_id),
                ).fetchone()
                if room is None:
                    raise ValueError("Room not found in this home")

            for key, column in allowed.items():
                if key not in updates:
                    continue
                value = updates[key]
                if key == "metadata":
                    value = json.dumps(value or {}, ensure_ascii=False)
                fields.append(f"{column} = %s")
                params.append(value)

            if fields:
                fields.append("updated_at = %s")
                params.append(utc_now())
                params.extend([device_id, home_id])
                conn.execute(
                    f"UPDATE public.devices SET {', '.join(fields)} WHERE id = %s AND home_id = %s",
                    params,
                )
            row = conn.execute(
                "SELECT * FROM public.devices WHERE id = %s AND home_id = %s",
                (device_id, home_id),
            ).fetchone()
            return self.public_device(row)

    def delete_manual_device(self, home_id: str, device_id: str) -> dict[str, Any] | None:
        with self.connect() as conn:
            row = conn.execute(
                "SELECT * FROM public.devices WHERE id = %s AND home_id = %s",
                (device_id, home_id),
            ).fetchone()
            if row is None:
                return None
            device = self.public_device(row)
            conn.execute("DELETE FROM public.devices WHERE id = %s AND home_id = %s", (device_id, home_id))
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
                INSERT INTO public.device_events (
                    id, home_id, room_id, device_id, actor_user_id, event_type,
                    source, value_json, created_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            row = conn.execute("SELECT energy_limit_kwh FROM public.homes WHERE id = %s", (home_id,)).fetchone()
            limit = float(row["energy_limit_kwh"]) if row and row["energy_limit_kwh"] is not None else DEFAULT_HOME_ENERGY_LIMIT_KWH

        now = datetime.now(timezone.utc)
        start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc).isoformat()

        with self.connect() as conn:
            plc_count = conn.execute(
                """
                SELECT COUNT(*) AS count
                FROM public.power_readings
                WHERE home_id = %s
                  AND timestamp >= %s
                  AND energy_kwh IS NOT NULL
                  AND energy_kwh >= 0
                  AND energy_kwh <= 1000000
                  AND source LIKE 'plc-s7-1200%%'
                """,
                (home_id, start_of_month),
            ).fetchone()["count"]
            source_filter = "AND source LIKE 'plc-s7-1200%%'" if plc_count else ""
            source_name = "plc-s7-1200" if plc_count else "all"
            readings_row = conn.execute(
                f"""
                SELECT MIN(energy_kwh) AS min_energy, MAX(energy_kwh) AS max_energy
                FROM public.power_readings
                WHERE home_id = %s
                  AND timestamp >= %s
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
                "UPDATE public.homes SET energy_limit_kwh = %s WHERE id = %s",
                (limit, home_id),
            )
            return cursor.rowcount > 0
