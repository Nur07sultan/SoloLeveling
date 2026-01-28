# SoloLeveling

Полная система личного трекинга развития с RPG-механикой (XP / уровни / ранги).

- Backend: Django + DRF (API)
- Frontend: Next.js

## Требования
- Python 3.11+
- Node.js 18+ (рекомендуется 20 LTS)
- npm

## Амантурчик все это сделай и все 

### 1) Клонирование
```bash
git clone https://github.com/Nur07sultan/SoloLeveling.git
cd SoloLeveling
```

### 2) Backend (Django)
```bash
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
pip install -r requirements.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

Backend API: `http://127.0.0.1:8000/api/`

### 3) Frontend (Next.js)
Открой второй терминал:
```bash
cd frontend
npm install
npm run dev -- --port 3000 --hostname 127.0.0.1
```

Frontend: `http://127.0.0.1:3000/`

### 4) (Опционально) Ollama для AI
Если хочешь включить AI-фичи через Ollama:

- Установить Ollama по инструкции с сайта Ollama
- Запустить сервер:

```bash
export OLLAMA_HOST=127.0.0.1:11434
ollama serve
```

И подтянуть модель (пример):
```bash
ollama pull qwen2.5:1.5b
```

## Аутентификация
Используется токен.

- После `register` / `login` вы получаете `token`.
- Во все запросы (кроме `/api/auth/*`) добавляйте заголовок:

`Authorization: Token <token>`

## Единый формат ответов
Успех:
```json
{"success": true, "data": {}, "errors": null}
```
Ошибка:
```json
{"success": false, "data": null, "errors": {"field": ["текст ошибки"]}}
```

## Схема API (OpenAPI)
- JSON схема: `GET /api/schema/`

Примечание: HTML-документация намеренно не включена — backend остаётся строго API-only.

## Частые проблемы
- Если `source venv/bin/activate` не работает: у нас venv называется `.venv`, активируй `source .venv/bin/activate`.
- Если заняты порты: поменяй `--port 3000` для frontend или `runserver 127.0.0.1:8000` для backend.
