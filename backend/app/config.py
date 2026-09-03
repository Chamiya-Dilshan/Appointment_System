import os
from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


class Config:
    """Base configuration shared by all environments."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_appointment_system")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    # Database Configuration
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "appointment_system")

    # Email / SMTP Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Ministry Appointment Portal")

    # SMS Gateway Configuration (e.g. Notify.lk / Twilio / Custom HTTP)
    SMS_GATEWAY_URL: str = os.getenv("SMS_GATEWAY_URL", "")
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_USER_ID: str = os.getenv("SMS_USER_ID", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "AppointSys")

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:  # noqa: N802
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


class DevelopmentConfig(Config):
    """Development-specific settings."""

    DEBUG: bool = True


class ProductionConfig(Config):
    """Production-specific settings."""

    DEBUG: bool = False


# Map environment name → config class
config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
