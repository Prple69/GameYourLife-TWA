from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app import models, crud, database, schemas

database.init_db()

app = FastAPI()

# РАЗРЕШАЕМ ТВОЙ VERCEL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://game-your-life-twa.vercel.app", # Твой фронт
        "http://localhost:5173"                 # Локальная разработка
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ЭНДПОИНТ: Получение или создание профиля
@app.get("/api/user/{tg_id}", response_model=schemas.UserSchema)
def get_profile(tg_id: str, username: str = "Hero", db: Session = Depends(database.get_db)):
    # 1. Пытаемся найти юзера
    user = crud.get_user_by_tg_id(db, tg_id)
    
    # 2. Если нет — создаем
    if not user:
        user = crud.create_user(db, tg_id, username)
        
    return user

# ЭНДПОИНТ: Смена аватара
@app.post("/api/user/update-avatar", response_model=schemas.UserSchema)
def update_avatar(tg_id: str, avatar_id: str, db: Session = Depends(database.get_db)):
    user = crud.update_user_avatar(db, tg_id, avatar_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user