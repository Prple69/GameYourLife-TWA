from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base  # Импортируем Base из моделей выше

SQLALCHEMY_DATABASE_URL = "sqlite:///./game.db"

# connect_args нужны только для SQLite, чтобы избежать ошибок потоков
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    # Эта команда создает файл game.db и все таблицы в нем
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()