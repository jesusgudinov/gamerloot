from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Gamer Loot API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str
    REDIS_URL: str

    SECRET_KEY: str = "super_secret_gamer_loot_key_12345" # En prod, esto irá en el .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 días
    
    # WooCommerce Config
    WC_URL: str = ""
    WC_CONSUMER_KEY: str = ""
    WC_CONSUMER_SECRET: str = ""
    
    # Quantum Imports Config
    QUANTUM_API_KEY: str = ""
    QUANTUM_API_SECRET: str = ""
    
    # TechSmart Scraper Config
    TECHSMART_RFC: str = ""
    TECHSMART_USERNAME: str = ""
    TECHSMART_PASSWORD: str = ""
    
    # Skydropx Config
    SKYDROPX_API_KEY: str = ""
    SKYDROPX_API_SECRET: str = ""
    SKYDROPX_API_URL: str = "https://pro.skydropx.com/api/v1"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
