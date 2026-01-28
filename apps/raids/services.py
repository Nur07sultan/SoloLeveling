from __future__ import annotations

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.stats.models import Rank, UserStats, XPEvent
from apps.stats.services import award_xp_event, ensure_user_stats

from .models import BossDamage, BossRun


def _boss_profile_for(stats: UserStats) -> tuple[str, str, int]:
    # Очень простой генератор босса по рангу/уровню.
    # Можно будет заменить на таблицу/seed.
    rank = stats.rank
    level = int(stats.level)

    if rank in (Rank.S,):
        return "Архитектор Дедлайнов", "S", 12000 + level * 150
    if rank in (Rank.A,):
        return "Лорд Продакшена", "A", 8000 + level * 120
    if rank in (Rank.B,):
        return "Токсичный Ревьюер", "B", 5000 + level * 90
    if rank in (Rank.C,):
        return "Пожиратель Контекста", "C", 3500 + level * 70
    if rank in (Rank.D,):
        return "Критичный Баг", "D", 2000 + level * 50
    return "Слайм Регрессии", "E", 1200 + level * 40


@transaction.atomic
def ensure_active_boss(*, user) -> BossRun:
    stats = ensure_user_stats(user)

    boss = BossRun.objects.select_for_update().filter(user=user, status=BossRun.Status.ACTIVE).first()
    if boss:
        return boss

    name, rank, hp = _boss_profile_for(stats)
    boss = BossRun.objects.create(user=user, name=name, rank=rank, hp_max=int(hp), hp_current=int(hp))
    return boss


@transaction.atomic
def attack_boss(*, user, max_events: int = 200) -> dict:
    boss = ensure_active_boss(user=user)

    # Берём неиспользованные XP события пользователя, начиная со старта босса.
    used_ids = BossDamage.objects.filter(boss=boss).values_list("xp_event_id", flat=True)

    qs = (
        XPEvent.objects.select_for_update()
        .filter(user=user, created_at__gte=boss.started_at)
        .exclude(id__in=used_ids)
        .order_by("created_at")
    )

    events = list(qs[: int(max_events)])
    damage = sum(max(0, int(e.amount)) for e in events)

    # Записываем, какие события были "поглощены".
    BossDamage.objects.bulk_create(
        [BossDamage(boss=boss, xp_event=e, amount=max(0, int(e.amount))) for e in events],
        ignore_conflicts=True,
    )

    boss.hp_current = max(0, int(boss.hp_current) - int(damage))

    defeated = False
    bonus_xp = 0
    if boss.hp_current <= 0 and boss.status == BossRun.Status.ACTIVE:
        boss.status = BossRun.Status.DEFEATED
        boss.defeated_at = timezone.now()
        defeated = True

        # Бонус: фикс + доля от HP.
        bonus_xp = int(200 + boss.hp_max // 10)
        award_xp_event(
            user=user,
            kind=XPEvent.Kind.BOSS_DEFEAT,
            amount=bonus_xp,
            source_type="boss_run",
            source_id=str(boss.id),
            metadata={"boss_name": boss.name, "boss_rank": boss.rank, "boss_hp_max": boss.hp_max},
            occurred_at=boss.defeated_at,
        )

    boss.save(update_fields=["hp_current", "status", "defeated_at"])

    total_used = BossDamage.objects.filter(boss=boss).aggregate(v=Sum("amount")).get("v") or 0

    return {
        "boss": boss,
        "damage": int(damage),
        "events_used": len(events),
        "total_damage": int(total_used),
        "defeated": bool(defeated),
        "bonus_xp": int(bonus_xp),
    }


@transaction.atomic
def start_next_boss(*, user) -> BossRun:
    # Явный переход к следующему боссу (после победы).
    BossRun.objects.select_for_update().filter(user=user, status=BossRun.Status.ACTIVE).update(status=BossRun.Status.DEFEATED)
    return ensure_active_boss(user=user)
