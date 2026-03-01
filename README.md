Понял тебя. Давай вернемся к чистому, структурированному формату, где каждый блок на своем месте. Это лучший вариант для GitHub: выглядит профессионально, легко копируется и не превращается в кашу.

Вот оформление твоего проекта **GameYourLife-TWA**:

---

## 📄 Файл: `README.md`

Это «лицо» твоего репозитория. Скопируй этот блок целиком.

```markdown
# 🎮 GameYourLife-TWA

**GameYourLife** — это Telegram Web App (TWA), которое превращает вашу повседневную жизнь в RPG-игру. Выполняйте задачи в реальном мире, получайте опыт (XP) и прокачивайте своего персонажа.

---

## 🛠 Установка и запуск

### 🐍 Backend (FastAPI)
1. **Создайте окружение и установите зависимости:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Для Windows: venv\Scripts\activate
   pip install -r requirements.txt

```

2. **Настройте переменные окружения:**
Создайте файл `.env` в корне бэкенда:
```env
DATABASE_URL=postgresql+asyncpg://postgres:purple666@127.0.0.1:5432/game_db
OPENAI_API_KEY=your_key_here

```


3. **Запустите сервер:**
```bash
uvicorn main:app --reload

```


> API Docs: [http://127.0.0.1:8000/docs](https://www.google.com/search?q=http://127.0.0.1:8000/docs)



---

### ⚛️ Frontend (React + Vite)

1. **Перейдите в папку и установите пакеты:**
```bash
cd frontend
npm install

```


2. **Запустите приложение:**
```bash
npm run dev

```


> Local URL: [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173)



---

## 📦 Стек технологий

* **Backend:** FastAPI, SQLAlchemy 2.0 (Async), PostgreSQL.
* **Frontend:** React, Vite, Tailwind CSS, @twa-dev/sdk.
* **AI Integration:** OpenAI API для генерации игровых механик.

```

---

## 🐍 Файл: `requirements.txt` (Backend)
Положи этот файл в корень бэкенда.

```text
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
asyncpg==0.29.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
openai==1.10.0

```

---

## ⚛️ Файл: `package.json` (Frontend)

Положи этот файл в папку `frontend`.

```json
{
  "name": "gameyourlife-twa-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "@twa-dev/sdk": "^7.0.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.284.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "vite": "^4.4.5"
  }
}

```

---

## 🛡️ Файл: `.gitignore`

Создай его в самом корне проекта, чтобы не залить лишнего.

```text
# Python
venv/
__pycache__/
*.pyc
.env

# Node.js
node_modules/
dist/
.DS_Store

# DB
*.sqlite3

```
