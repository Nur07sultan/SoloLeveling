from __future__ import annotations

from django.db import transaction

from apps.stats.models import XPEvent
from apps.stats.services import award_xp_event

from .models import LearningLog

LEARNING_LOG_XP = 25


@transaction.atomic
def create_learning_log(*, user, validated_data: dict) -> LearningLog:
    log = LearningLog.objects.create(user=user, **validated_data)
    award_xp_event(
        user=user,
        kind=XPEvent.Kind.LEARNING_LOG,
        amount=LEARNING_LOG_XP,
        source_type="learning_log",
        source_id=str(log.id),
        metadata={
            "date": str(log.date),
            "title": log.title,
        },
        occurred_at=log.created_at,
    )
    return log
