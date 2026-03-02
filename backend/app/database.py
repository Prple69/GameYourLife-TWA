from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# Используем 127.0.0.1 вместо localhost для исключения задержек DNS (пинг)
engine = create_async_engine(
    settings.DATABASE_URL,
    future=True
)

# Настройка фабрики сессий
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


# Зависимость для FastAPI эндпоинтов
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Функция для создания таблиц (вызывается при старте приложения)
async def init_db():
    from .models import Base  # Импорт строго здесь, чтобы избежать круговых зависимостей
    async with engine.begin() as conn:
        # Это удалит всё и создаст заново (полезно для первого раза)
        # await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
