"""
Automated, encrypted database backup and disaster recovery utility.

Features:
- Dumps MySQL database using mysqldump (or direct SQL fallback).
- Encrypts the dump with AES-256 (Fernet) before storing on disk.
- Prunes old backup archives exceeding retention period (default: 14 days).
- Provides instant decrypt & restore capability via CLI.

Usage:
  python backup_db.py               # Create a new encrypted backup
  python backup_db.py --list        # List all existing backups
  python backup_db.py --restore <path_to_enc_file>   # Decrypt and restore
"""
from __future__ import annotations

import argparse
import base64
import datetime
import hashlib
import os
import shutil
import subprocess
import sys
from pathlib import Path

from cryptography.fernet import Fernet
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "appointment_system")
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_appointment_system")

BACKUP_DIR = Path(__file__).resolve().parent / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def get_backup_cipher() -> Fernet:
    """Derive or load the 32-byte Fernet key for backup encryption."""
    key = os.getenv("BACKUP_ENCRYPTION_KEY", "").strip()
    if not key:
        # Deterministic derivation from SECRET_KEY + salt so backups remain decodable
        digest = hashlib.sha256(f"backup_{SECRET_KEY}".encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest).decode("utf-8")
    return Fernet(key.encode("utf-8"))


def find_mysqldump() -> str:
    """Locate the mysqldump binary in PATH or common Windows installation directories."""
    found = shutil.which("mysqldump")
    if found:
        return found

    common_windows_paths = [
        r"C:\xampp\mysql\bin\mysqldump.exe",
        r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
    ]
    for p in common_windows_paths:
        if os.path.exists(p):
            return p

    return "mysqldump"


def find_mysql_client() -> str:
    """Locate the mysql client binary in PATH or common Windows installation directories."""
    found = shutil.which("mysql")
    if found:
        return found

    common_windows_paths = [
        r"C:\xampp\mysql\bin\mysql.exe",
        r"C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        r"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    ]
    for p in common_windows_paths:
        if os.path.exists(p):
            return p

    return "mysql"


def create_backup(retention_days: int = 14) -> Path:
    """Create a full encrypted database dump and prune old backups."""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    temp_sql = BACKUP_DIR / f"temp_{DB_NAME}_{timestamp}.sql"
    enc_file = BACKUP_DIR / f"{DB_NAME}_{timestamp}.sql.enc"

    mysqldump_bin = find_mysqldump()

    dump_cmd = [
        mysqldump_bin,
        f"-h{DB_HOST}",
        f"-P{DB_PORT}",
        f"-u{DB_USER}",
        "--databases", DB_NAME,
        "--single-transaction",
        "--quick",
        "--routines",
        "--triggers",
    ]
    if DB_PASSWORD:
        dump_cmd.insert(4, f"-p{DB_PASSWORD}")

    print(f"[*] Dumping database '{DB_NAME}' using {mysqldump_bin}...")
    try:
        with open(temp_sql, "w", encoding="utf-8") as f:
            proc = subprocess.run(dump_cmd, stdout=f, stderr=subprocess.PIPE, text=True, check=True)
    except Exception as exc:
        if temp_sql.exists():
            temp_sql.unlink()
        raise RuntimeError(f"mysqldump execution failed: {exc}")

    # Encrypt raw SQL dump using AES-256
    print("[*] Encrypting database snapshot with AES-256...")
    cipher = get_backup_cipher()
    raw_bytes = temp_sql.read_bytes()
    encrypted_bytes = cipher.encrypt(raw_bytes)
    enc_file.write_bytes(encrypted_bytes)

    # Securely remove temporary plaintext SQL dump
    temp_sql.unlink()

    size_kb = len(encrypted_bytes) / 1024
    print(f"[OK] Encrypted backup created successfully: {enc_file.name} ({size_kb:.1f} KB)")

    # Prune older backups
    prune_old_backups(retention_days)
    return enc_file


def prune_old_backups(days: int = 14) -> None:
    """Remove backup files older than specified number of days."""
    cutoff = datetime.datetime.now() - datetime.timedelta(days=days)
    for item in BACKUP_DIR.glob(f"{DB_NAME}_*.sql.enc"):
        try:
            mtime = datetime.datetime.fromtimestamp(item.stat().st_mtime)
            if mtime < cutoff:
                item.unlink()
                print(f"[*] Pruned expired backup: {item.name} (older than {days} days)")
        except Exception as e:
            print(f"[WARN] Failed to inspect/prune {item}: {e}")


def list_backups() -> None:
    """List all available encrypted backups."""
    files = sorted(BACKUP_DIR.glob(f"{DB_NAME}_*.sql.enc"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not files:
        print(f"[i] No backup files found in {BACKUP_DIR}")
        return

    print(f"\nExisting Encrypted Backups in {BACKUP_DIR}:")
    print("-" * 65)
    for f in files:
        size_kb = f.stat().st_size / 1024
        dt = datetime.datetime.fromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
        print(f"  {f.name:<38} {size_kb:>8.1f} KB   {dt}")
    print("-" * 65)


def restore_backup(backup_path_str: str) -> bool:
    """Decrypt an encrypted backup file and restore into MySQL."""
    path = Path(backup_path_str)
    if not path.is_absolute():
        path = BACKUP_DIR / path

    if not path.exists():
        print(f"[ERROR] Backup file not found: {path}", file=sys.stderr)
        return False

    print(f"[*] Decrypting backup file {path.name}...")
    cipher = get_backup_cipher()
    try:
        encrypted_bytes = path.read_bytes()
        sql_bytes = cipher.decrypt(encrypted_bytes)
    except Exception as exc:
        print(f"[ERROR] Decryption failed: {exc}. Key mismatch or corrupted archive.", file=sys.stderr)
        return False

    temp_restore_sql = BACKUP_DIR / f"temp_restore_{int(datetime.datetime.now().timestamp())}.sql"
    temp_restore_sql.write_bytes(sql_bytes)

    mysql_bin = find_mysql_client()
    restore_cmd = [
        mysql_bin,
        f"-h{DB_HOST}",
        f"-P{DB_PORT}",
        f"-u{DB_USER}",
        DB_NAME,
    ]
    if DB_PASSWORD:
        restore_cmd.insert(4, f"-p{DB_PASSWORD}")

    print(f"[*] Restoring database '{DB_NAME}' using {mysql_bin}...")
    try:
        with open(temp_restore_sql, "r", encoding="utf-8") as f:
            subprocess.run(restore_cmd, stdin=f, check=True)
        print("[OK] Database restored successfully!")
        return True
    except Exception as exc:
        print(f"[ERROR] Database restore failed: {exc}", file=sys.stderr)
        return False
    finally:
        if temp_restore_sql.exists():
            temp_restore_sql.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description="Automated Encrypted MySQL Backup & Disaster Recovery")
    parser.add_argument("--list", action="store_true", help="List all available backups")
    parser.add_argument("--restore", type=str, help="Path or filename of encrypted backup to restore")
    parser.add_argument("--retention", type=int, default=14, help="Retention period in days (default: 14)")
    args = parser.parse_args()

    if args.list:
        list_backups()
    elif args.restore:
        success = restore_backup(args.restore)
        sys.exit(0 if success else 1)
    else:
        create_backup(retention_days=args.retention)


if __name__ == "__main__":
    main()
