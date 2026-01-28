from __future__ import annotations

from datetime import timedelta

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apps.stats.models import XPEvent
from apps.stats.services import award_xp_event

from .models import FocusSession


# Настройки честной прокачки (можно вынести в config позже)
FOCUS_XP_PER_MINUTE = 2
FOCUS_MIN_MINUTES = 5
FOCUS_SESSION_CAP_MINUTES = 120
FOCUS_DAILY_CAP_XP = 300


def _today_bounds():
    now = timezone.now()
    start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end = start + timedelta(days=1)
    return start, end


@transaction.atomic
def start_focus_session(
    *,
    user,
    kind: str,
    note: str = "",
    skill_node_id: int | None = None,
) -> tuple[FocusSession, bool]:
    # Если уже есть активная — возвращаем её.
    active = FocusSession.objects.select_for_update().filter(user=user, ended_at__isnull=True, canceled=False).first()
    if active:
        return active, False

    session = FocusSession.objects.create(
        user=user,
        kind=kind,
        note=note or "",
        skill_node_id=skill_node_id,
        started_at=timezone.now(),
    )
    return session, True


@transaction.atomic
def cancel_focus_session(*, user) -> FocusSession | None:
    active = FocusSession.objects.select_for_update().filter(user=user, ended_at__isnull=True, canceled=False).first()
    if not active:
        return None

    now = timezone.now()
    duration = max(0, int((now - active.started_at).total_seconds()))
    active.ended_at = now
    active.canceled = True
    active.duration_seconds = duration
    active.xp_awarded = 0
    active.save(update_fields=["ended_at", "canceled", "duration_seconds", "xp_awarded", "updated_at"])
    return active


@transaction.atomic
def stop_focus_session(*, user, source_url: str = "") -> tuple[FocusSession | None, int]:
    active = FocusSession.objects.select_for_update().filter(user=user, ended_at__isnull=True, canceled=False).first()
    if not active:
        return None, 0

    now = timezone.now()
    duration_seconds = max(0, int((now - active.started_at).total_seconds()))
    minutes = duration_seconds // 60

    # Кап по сессии
    minutes_capped = min(int(minutes), int(FOCUS_SESSION_CAP_MINUTES))

    xp_raw = minutes_capped * int(FOCUS_XP_PER_MINUTE)
    if minutes_capped < int(FOCUS_MIN_MINUTES):
        xp_raw = 0

    # Дневной кап по XP именно от фокуса
    day_start, day_end = _today_bounds()
    used_today = (
        XPEvent.objects.filter(
            user=user,
            kind=XPEvent.Kind.FOCUS_SESSION,
            created_at__gte=day_start,
            created_at__lt=day_end,
        ).aggregate(v=Sum("amount")).get("v")
        or 0
    )
    remaining = max(0, int(FOCUS_DAILY_CAP_XP) - int(used_today))
    xp_award = min(int(xp_raw), int(remaining))

    active.ended_at = now
    active.duration_seconds = duration_seconds

    if xp_award > 0:
        award_xp_event(
            user=user,
            kind=XPEvent.Kind.FOCUS_SESSION,
            amount=xp_award,
            source_type="focus_session",
            source_id=str(active.id),
            source_url=source_url or "",
            metadata={
                "kind": active.kind,
                "minutes": int(minutes_capped),
                "duration_seconds": int(duration_seconds),
                "skill_node_id": active.skill_node_id,
            },
            occurred_at=now,
        )

    active.xp_awarded = int(xp_award)
    active.save(update_fields=["ended_at", "duration_seconds", "xp_awarded", "updated_at"])
    return active, int(xp_award)
