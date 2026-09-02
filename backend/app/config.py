import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration shared by all environments."""

    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev_secret_key_appointment_system")
    SQLALCHEMY_TRACK_MODIFICATIONS: bool = False

    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "appointment_system")

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
