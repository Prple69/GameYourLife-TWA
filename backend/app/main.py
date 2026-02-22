from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import database, models, schemas, users, shop, quests

# Создаем таблицы при запуске
database.init_db()

app = FastAPI(title="Pixel RPG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # В проде укажи конкретный домен Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- USER ENDPOINTS ---

@app.get("/api/user/{tg_id}", response_model=schemas.UserSchema)
def get_user(tg_id: str, db: Session = Depends(database.get_db)):
    # Логика: найти или создать (из нашего users.py)
    user = users.get_or_create_user(db, tg_id, f"Hero_{tg_id[:5]}")
    return user

@app.post("/api/user/update-avatar", response_model=schemas.UserSchema)
def update_avatar(user_id: int, avatar_key: str, db: Session = Depends(database.get_db)):
    user = users.update_avatar(db, user_id, avatar_key)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- SHOP ENDPOINTS ---

@app.post("/api/shop/buy", response_model=schemas.UserSchema)
def buy_item(user_id: int, item_slug: str, price: int, db: Session = Depends(database.get_db)):
    updated_user, error = shop.process_purchase(db, user_id, item_slug, price)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return updated_user

# --- LEADERBOARD ---

@app.get("/api/leaderboard", response_model=list[schemas.UserSchema])
def get_leaderboard(db: Session = Depends(database.get_db)):
    return users.get_leaderboard(db)