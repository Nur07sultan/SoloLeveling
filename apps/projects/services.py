from __future__ import annotations

from django.db import transaction

from apps.stats.models import XPEvent
from apps.stats.services import award_xp_event

from .models import Project, Task


@transaction.atomic
def create_project(*, user, validated_data: dict) -> Project:
    return Project.objects.create(user=user, **validated_data)


@transaction.atomic
def create_task(*, user, validated_data: dict) -> Task:
    # Serializer guarantees project belongs to user.
    return Task.objects.create(**validated_data)


@transaction.atomic
def complete_task(*, task: Task) -> Task:
    task = Task.objects.select_for_update().select_related("project").get(pk=task.pk)
    if task.status != Task.Status.DONE:
        task.mark_completed()
        xp = int(task.difficulty) * 50
        award_xp_event(
            user=task.project.user,
            kind=XPEvent.Kind.TASK_COMPLETE,
            amount=xp,
            source_type="task",
            source_id=str(task.id),
            metadata={
                "difficulty": int(task.difficulty),
                "project_id": int(task.project_id),
                "type": getattr(task, "type", None),
            },
            occurred_at=task.completed_at,
        )
    return task
