# 🎮 GameYourLife-TWA (Full Stack Setup)

| Секция | Содержание и команды |
| :--- | :--- |
| **📝 Описание** | **GameYourLife** — это Telegram Web App (TWA), геймифицирующее реальные задачи. <br> Стек: **FastAPI (Python)** + **React (Vite)** + **PostgreSQL**. |
| **⚙️ Backend: Зависимости** | Создайте `requirements.txt`: <br> `fastapi==0.109.0` <br> `uvicorn[standard]==0.27.0` <br> `sqlalchemy==2.0.25` <br> `asyncpg==0.29.0` <br> `pydantic-settings==2.1.0` <br> `python-dotenv==1.0.0` <br> `openai==1.10.0` |
| **🛠 Backend: Установка** | `python -m venv venv` <br> `source venv/bin/activate` (или `venv\Scripts\activate` на Win) <br> `pip install -r requirements.txt` |
| **🔑 Backend: Окружение** | Создайте `.env`: <br> `DATABASE_URL=postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db` <br> `OPENAI_API_KEY=your_key` |
| **🚀 Backend: Запуск** | `uvicorn main:app --reload` <br> API Docs: `http://127.0.0.1:8000/docs` |
| **📦 Frontend: Зависимости** | В `package.json` (dependencies): <br> `@twa-dev/sdk`, `axios`, `zustand`, `lucide-react`, `react-router-dom` |
| **🖥️ Frontend: Установка** | `cd frontend` <br> `npm install` |
| **⚡ Frontend: Запуск** | `npm run dev` <br> Local URL: `http://localhost:5173` |
| **🛡️ Git Safety** | Добавьте в `.gitignore`: <br> `venv/`, `node_modules/`, `.env`, `__pycache__/`, `dist/` |

---

### Пример загрузки БД из .env (Python)
```python
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
