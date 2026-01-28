# Контракты API — SOLO DEV SYSTEM

Базовый префикс: `/api/`

## Auth
### POST /api/auth/register/
Запрос:
```json
{"username":"nurs","email":"nurs@example.com","password":"secret1234"}
```
Ответ:
```json
{"success":true,"data":{"token":"...","user":{"id":1,"username":"nurs","email":"nurs@example.com"}},"errors":null}
```

### POST /api/auth/login/
Запрос:
```json
{"username":"nurs","password":"secret1234"}
```
Ответ: как в `register`.

### POST /api/auth/logout/
Заголовки: `Authorization: Token <token>`
Ответ: `204 No Content`

## Profile
### GET /api/profile/
Ответ:
```json
{
  "success": true,
  "data": {
    "nickname": "nurs",
    "rank": "D",
    "level": 6,
    "xp": 820,
    "key_skills": [{"id":1,"name":"Python","level":55,"status":"practicing"}],
    "active_projects": [{"id":1,"name":"Internship","is_commercial":false}]
  },
  "errors": null
}
```

## Dashboard
### GET /api/dashboard/
Ответ:
```json
{
  "success": true,
  "data": {
    "level": 6,
    "xp": 820,
    "rank": "D",
    "dev_score": 1380,
    "balance": 3200,
    "workouts_this_week": 4,
    "tasks_done": 12,
    "skills_in_progress": 3
  },
  "errors": null
}
```

## Finance
### GET /api/finance/
### POST /api/finance/
### PATCH /api/finance/{id}/
### DELETE /api/finance/{id}/
Модель:
- `type`: `income|expense`
- `amount`: number
- `category`: string
- `date`: `YYYY-MM-DD`
- `description`: string

## Workouts
### GET /api/workouts/
### POST /api/workouts/
Модель:
- `type`: string
- `duration`: minutes (int)
- `intensity`: 1..10
- `date`: `YYYY-MM-DD`

XP: `duration * intensity`

## Skills
### GET /api/skills/
### POST /api/skills/
### PATCH /api/skills/{id}/
Модель:
- `name`: string
- `level`: 0..100
- `status`: auto (`learning|practicing|mastered`)

XP (додумано):
- при росте уровня: `Δlevel * 2`
- при переходе в `mastered`: бонус `+100 XP`

## Projects
### GET /api/projects/
### POST /api/projects/
Модель:
- `name`: string
- `is_commercial`: boolean

## Tasks
### GET /api/tasks/
### POST /api/tasks/
### POST /api/tasks/{id}/complete/
Модель:
- `project`: project_id
- `title`: string
- `status`: `todo|in_progress|done`
- `difficulty`: 1..5
- `deadline`: `YYYY-MM-DD|null`

XP за complete: `difficulty * 50`, фиксируется `completed_at`.

## Learning Logs
### GET /api/logs/
### POST /api/logs/
Модель:
- `title`: string
- `description`: string
- `date`: `YYYY-MM-DD`

XP (додумано): фикс `25 XP` за запись.

## Правила безопасности
- Все endpoints кроме `/api/auth/*` требуют `Authorization: Token ...`
- Все querysets фильтруются по владельцу данных
