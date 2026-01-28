from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction
from django.db.models import Avg

from .models import Rank, UserStats, XPEvent


@dataclass(frozen=True)
class DevScoreBreakdown:
    total_xp: int
    avg_skill_level: int
    completed_tasks: int
    mastered_skills: int
    commercial_projects: int
    dev_score: int
    rank: str


RANK_THRESHOLDS = [
    (Rank.S, 10000),
    (Rank.A, 6000),
    (Rank.B, 3000),
    (Rank.C, 1500),
    (Rank.D, 500),
    (Rank.E, 0),
]


def xp_required_to_reach_level(level: int) -> int:
    """Total XP required to *be* at `level`.

    Level 1 -> 0 XP
    Level 2 -> 100 XP
    Level 3 -> 100 + 200 = 300 XP
    ...
    """

    if level <= 1:
        return 0
    return ((level - 1) * level // 2) * 100


def rank_for_dev_score(dev_score: int) -> str:
    for rank, threshold in RANK_THRESHOLDS:
        if dev_score >= threshold:
            return rank
    return Rank.E


@transaction.atomic
def ensure_user_stats(user) -> UserStats:
    stats, _ = UserStats.objects.select_for_update().get_or_create(user=user)
    return stats


@transaction.atomic
def add_xp(*, user, amount: int) -> UserStats:
    if amount <= 0:
        return ensure_user_stats(user)

    stats = ensure_user_stats(user)
    stats.xp += int(amount)

    # Level-up based on total XP.
    before_level = int(stats.level)
    while stats.xp >= xp_required_to_reach_level(stats.level + 1):
        stats.level += 1

    levels_gained = int(stats.level) - before_level
    if levels_gained > 0:
        # Базовое правило: 5 очков характеристик за уровень.
        stats.stat_points += levels_gained * 5

    stats.xp_to_next_level = stats.level * 100

    breakdown = recalculate_dev_score(user=user, stats=stats, save=False)
    stats.dev_score = breakdown.dev_score
    stats.rank = breakdown.rank
    stats.save(update_fields=["xp", "level", "xp_to_next_level", "stat_points", "dev_score", "rank", "updated_at"])
    return stats


@transaction.atomic
def award_xp_event(
    *,
    user,
    kind: str,
    amount: int,
    source_type: str = "",
    source_id: str = "",
    source_url: str = "",
    metadata: dict | None = None,
    occurred_at=None,
) -> tuple[XPEvent | None, UserStats]:
    """Начисляет опыт *через событие*.

    Это основа "честной" прокачки: каждое начисление имеет причину/источник,
    может быть проверено и использовано в аналитике.

    Возвращает (event|None, stats). event=None если amount<=0.
    """
    if int(amount) <= 0:
        return None, ensure_user_stats(user)

    metadata = metadata or {}

    # Идемпотентность: если пришёл тот же внешний источник, не начисляем повторно.
    if source_type and source_id:
        event, created = XPEvent.objects.get_or_create(
            user=user,
            source_type=str(source_type),
            source_id=str(source_id),
            defaults={
                "kind": kind,
                "amount": int(amount),
                "source_url": source_url or "",
                "metadata": metadata,
                "occurred_at": occurred_at,
            },
        )
        if not created:
            # Событие уже было — возвращаем текущие статы без повторного начисления.
            return event, ensure_user_stats(user)
    else:
        event = XPEvent.objects.create(
            user=user,
            kind=kind,
            amount=int(amount),
            source_type=str(source_type or ""),
            source_id=str(source_id or ""),
            source_url=source_url or "",
            metadata=metadata,
            occurred_at=occurred_at,
        )

    stats = add_xp(user=user, amount=int(amount))
    return event, stats


@transaction.atomic
def recalculate_dev_score(*, user, stats: UserStats | None = None, save: bool = True) -> DevScoreBreakdown:
    from apps.projects.models import Project, Task
    from apps.skills.models import Skill

    stats = stats or ensure_user_stats(user)

    avg_skill_level = (
        Skill.objects.filter(user=user).aggregate(v=Avg("level")).get("v")
        or 0
    )
    avg_skill_level = int(avg_skill_level)

    completed_tasks = Task.objects.filter(project__user=user, status=Task.Status.DONE).count()
    mastered_skills = Skill.objects.filter(user=user, status=Skill.Status.MASTERED).count()
    commercial_projects = Project.objects.filter(user=user, is_commercial=True).count()

    dev_score = (
        int(stats.xp)
        + avg_skill_level * 5
        + completed_tasks * 20
        + mastered_skills * 100
        + commercial_projects * 300
    )

    rank = rank_for_dev_score(dev_score)

    if save:
        stats.dev_score = dev_score
        stats.rank = rank
        stats.level = max(stats.level, 1)
        stats.xp_to_next_level = stats.level * 100
        stats.save(update_fields=["dev_score", "rank", "level", "xp_to_next_level", "updated_at"])

    return DevScoreBreakdown(
        total_xp=int(stats.xp),
        avg_skill_level=avg_skill_level,
        completed_tasks=completed_tasks,
        mastered_skills=mastered_skills,
        commercial_projects=commercial_projects,
        dev_score=dev_score,
        rank=rank,
    )


@transaction.atomic
def allocate_stat_points(*, user, delta: dict[str, int]) -> UserStats:
    stats = ensure_user_stats(user)
    stats = UserStats.objects.select_for_update().get(pk=stats.pk)

    inc_strength = int(delta.get("strength", 0) or 0)
    inc_agility = int(delta.get("agility", 0) or 0)
    inc_intelligence = int(delta.get("intelligence", 0) or 0)
    inc_vitality = int(delta.get("vitality", 0) or 0)

    for v in (inc_strength, inc_agility, inc_intelligence, inc_vitality):
        if v < 0:
            raise ValueError("Нельзя распределять отрицательные значения")

    total = inc_strength + inc_agility + inc_intelligence + inc_vitality
    if total <= 0:
        return stats

    if total > int(stats.stat_points):
        raise ValueError("Недостаточно свободных очков")

    stats.strength += inc_strength
    stats.agility += inc_agility
    stats.intelligence += inc_intelligence
    stats.vitality += inc_vitality
    stats.stat_points -= total
    stats.save(
        update_fields=[
            "strength",
            "agility",
            "intelligence",
            "vitality",
            "stat_points",
            "updated_at",
        ]
    )
    return stats
