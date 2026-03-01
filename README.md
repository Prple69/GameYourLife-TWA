## 🛠 Установка и запуск

Проект разделен на две части: **Backend** (FastAPI) и **Frontend** (React + Vite).

### 1. Требования
- Python 3.10+
- Node.js 18+
- PostgreSQL

### 2. Настройка Backend
Перейдите в директорию бэкенда (если он в корне или папке /backend):
```bash
# Создание виртуального окружения
python -m venv venv

# Активация (Windows)
venv\Scripts\activate
# Активация (Mac/Linux)
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt

# Создайте файл .env и укажите настройки БД и OpenAI
# DATABASE_URL=postgresql+asyncpg://user:pass@127.0.0.1:5432/game_db
# OPENAI_API_KEY=your_key_here
