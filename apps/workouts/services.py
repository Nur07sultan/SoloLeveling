from __future__ import annotations

from django.db import transaction

from apps.stats.services import award_xp_event
from apps.stats.models import XPEvent

from .models import Workout


@transaction.atomic
def create_workout(*, user, validated_data: dict) -> Workout:
    workout = Workout.objects.create(user=user, **validated_data)
    xp = int(workout.duration) * int(workout.intensity)
    award_xp_event(
        user=user,
        kind=XPEvent.Kind.WORKOUT,
        amount=xp,
        source_type="workout",
        source_id=str(workout.id),
        metadata={
            "duration": int(workout.duration),
            "intensity": int(workout.intensity),
            "date": str(workout.date),
            "type": workout.type,
        },
        occurred_at=workout.created_at,
    )
    return workout
