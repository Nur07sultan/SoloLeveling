from __future__ import annotations

import re

from rest_framework.exceptions import ValidationError

from apps.projects.models import Task
from apps.projects.services import complete_task
from apps.raids.services import attack_boss, ensure_active_boss, start_next_boss
from apps.stats.services import ensure_user_stats
from apps.focus.services import start_focus_session, stop_focus_session


def _int(value, *, name: str) -> int:
    try:
        return int(value)
    except Exception:
        raise ValidationError({"non_field_errors": [f"Некорректный {name}"]})


def list_actions() -> list[dict]:
    return [
        {"name": "hero_stats", "description": "Показать твои статы героя (уровень/XP/ранг/dev_score)."},
        {"name": "boss_status", "description": "Показать текущего босса и его HP."},
        {"name": "boss_attack", "description": "Поглотить XP-события и нанести урон боссу."},
        {"name": "boss_next", "description": "Перейти к следующему боссу."},
        {"name": "focus_start", "description": "Начать фокус-сессию."},
        {"name": "focus_stop", "description": "Остановить фокус-сессию и получить XP."},
        {"name": "task_complete", "description": "Завершить квест (задачу) по id."},
    ]


def execute_action(*, user, action: dict) -> dict:
    name = (action or {}).get("name")
    args = (action or {}).get("args") or {}

    if name == "hero_stats":
        stats = ensure_user_stats(user)
        return {
            "level": stats.level,
            "xp": stats.xp,
            "rank": stats.rank,
            "dev_score": stats.dev_score,
        }

    if name == "boss_status":
        boss = ensure_active_boss(user=user)
        return {
            "id": boss.id,
            "name": boss.name,
            "rank": boss.rank,
            "hp_current": boss.hp_current,
            "hp_max": boss.hp_max,
            "status": boss.status,
        }

    if name == "boss_attack":
        max_events = _int(args.get("max_events", 200), name="max_events")
        result = attack_boss(user=user, max_events=max_events)
        boss = result["boss"]
        return {
            "boss": {
                "id": boss.id,
                "name": boss.name,
                "rank": boss.rank,
                "hp_current": boss.hp_current,
                "hp_max": boss.hp_max,
                "status": boss.status,
            },
            "damage": result["damage"],
            "events_used": result["events_used"],
            "total_damage": result["total_damage"],
            "defeated": result["defeated"],
            "bonus_xp": result["bonus_xp"],
        }

    if name == "boss_next":
        boss = start_next_boss(user=user)
        return {
            "id": boss.id,
            "name": boss.name,
            "rank": boss.rank,
            "hp_current": boss.hp_current,
            "hp_max": boss.hp_max,
            "status": boss.status,
        }

    if name == "focus_start":
        kind = str(args.get("kind") or "coding")
        note = str(args.get("note") or "")
        skill_node_id = args.get("skill_node_id")
        if skill_node_id is not None:
            skill_node_id = _int(skill_node_id, name="skill_node_id")
        session, _created = start_focus_session(user=user, kind=kind, note=note, skill_node_id=skill_node_id)
        return {
            "id": session.id,
            "kind": session.kind,
            "started_at": session.started_at.isoformat(),
        }

    if name == "focus_stop":
        source_url = str(args.get("source_url") or "")
        session, xp = stop_focus_session(user=user, source_url=source_url)
        if not session:
            raise ValidationError({"non_field_errors": ["Активная фокус-сессия не найдена"]})
        return {
            "id": session.id,
            "ended_at": session.ended_at.isoformat() if session.ended_at else None,
            "duration_seconds": session.duration_seconds,
            "xp_awarded": xp,
        }

    if name == "task_complete":
        task_id = _int(args.get("task_id"), name="task_id")
        task = Task.objects.filter(id=task_id, project__user=user).first()
        if not task:
            raise ValidationError({"non_field_errors": ["Задача не найдена или не принадлежит тебе"]})
        task = complete_task(task=task)
        return {"id": task.id, "title": task.title, "status": task.status, "xp_reward": int(task.difficulty) * 50}

    raise ValidationError({"non_field_errors": ["Неизвестная команда ИИ"]})


ACTION_PATTERN = re.compile(r"```action\s*(\{[\s\S]*?\})\s*```", re.IGNORECASE)


def extract_action_from_text(text: str) -> tuple[str, dict | None]:
    """Ожидаем от модели блок вида:

    ```action
    {"name": "focus_start", "args": {"kind":"coding"}}
    ```

    Если блока нет — action=None.
    Возвращает (clean_text, action).
    """

    if not text:
        return "", None

    m = ACTION_PATTERN.search(text)
    if not m:
        return text.strip(), None

    raw_json = m.group(1)
    clean = (text[: m.start()] + text[m.end() :]).strip()

    try:
        import json

        action = json.loads(raw_json)
    except Exception:
        action = None

    return clean, action
