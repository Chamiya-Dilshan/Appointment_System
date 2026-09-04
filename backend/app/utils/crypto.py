"""Field-level encryption utility for protecting sensitive citizen PII at rest in MySQL."""
from __future__ import annotations

import base64
import hashlib
import os
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from flask import current_app


def get_fernet_cipher() -> Fernet:
    """
    Retrieve or derive the master Fernet key.
    If FIELD_ENCRYPTION_KEY is configured, use it directly.
    Otherwise, derive a deterministic 32-byte key from SECRET_KEY so existing
    deployments work seamlessly without configuration disruption.
    """
    key = ""
    try:
        key = current_app.config.get("FIELD_ENCRYPTION_KEY", "").strip()
    except RuntimeError:
        pass

    if not key:
        key = os.getenv("FIELD_ENCRYPTION_KEY", "").strip()

    if not key:
        secret = "dev_secret_key_appointment_system"
        try:
            secret = current_app.config.get("SECRET_KEY", secret)
        except RuntimeError:
            secret = os.getenv("SECRET_KEY", secret)

        digest = hashlib.sha256(secret.encode("utf-8")).digest()
        key = base64.urlsafe_b64encode(digest).decode("utf-8")

    return Fernet(key.encode("utf-8"))


def encrypt_field(raw_value: Optional[str]) -> str:
    """
    Encrypt a plaintext string using AES-128-CBC with HMAC-SHA256 (Fernet).
    Avoids double-encrypting values that are already Fernet tokens.
    """
    if not raw_value:
        return ""

    text = str(raw_value).strip()
    # Fernet ciphertexts always begin with 'gAAAAA'
    if text.startswith("gAAAAA") and len(text) > 40:
        return text

    cipher = get_fernet_cipher()
    token = cipher.encrypt(text.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_field(stored_value: Optional[str]) -> str:
    """
    Decrypt a Fernet ciphertext token back into plaintext.
    Backward-compatible: If the value is legacy plaintext, returns it intact.
    """
    if not stored_value:
        return ""

    text = str(stored_value).strip()
    # If not a Fernet ciphertext, it's legacy plaintext
    if not text.startswith("gAAAAA") or len(text) < 40:
        return text

    try:
        cipher = get_fernet_cipher()
        decrypted = cipher.decrypt(text.encode("utf-8"))
        return decrypted.decode("utf-8")
    except (InvalidToken, Exception):
        # Fallback gracefully if key changed or token corrupted
        return text
