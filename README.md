# 🎮 GameYourLife-TWA

**GameYourLife** — это инновационное Telegram Web App (TWA), которое превращает вашу повседневную жизнь в RPG-игру. Выполняйте задачи, прокачивайте навыки и отслеживайте прогресс прямо в мессенджере.

---

## 🚀 Стек технологий

| Компонент | Технология | Библиотеки |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ | FastAPI, SQLAlchemy (Async), Pydantic |
| **Frontend** | React + Vite | Tailwind CSS, @twa-dev/sdk, Zustand |
| **Database** | PostgreSQL | asyncpg (асинхронный драйвер) |
| **AI** | OpenAI | GPT-4 API (для генерации контента) |

---

## 🛠 Установка и запуск

Проект разделен на две части: **Backend** (API) и **Frontend** (Клиент).

### 1️⃣ Предварительные требования
* Установленный **Python 3.10+**
* Установленный **Node.js 18+**
* Запущенный **PostgreSQL** и созданная БД `game_db`

---

### 2️⃣ Настройка Backend (API) 🐍

Перейдите в папку с бэкендом (или в корень проекта):

```bash
# Создание и активация виртуального окружения
python -m venv venv

# Для Windows:
venv\Scripts\activate
# Для Mac/Linux:
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Настройка окружения
# Создайте файл .env и добавьте настройки:
# DATABASE_URL=postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db
# OPENAI_API_KEY=your_key_here

# Запуск сервера разработки
uvicorn main:app --reload
