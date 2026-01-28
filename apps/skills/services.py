from __future__ import annotations

from django.db import transaction

from apps.stats.models import XPEvent
from apps.stats.services import award_xp_event

from .models import Skill


@transaction.atomic
def create_skill(*, user, validated_data: dict) -> Skill:
    # Если навык создаётся из дерева, фиксируем канонические category/name.
    node = validated_data.get("node")
    if node is not None:
        validated_data = {
            **validated_data,
            "category": getattr(getattr(node, "track", None), "title", "Backend"),
            "name": getattr(node, "title", validated_data.get("name", "")),
        }

    skill = Skill.objects.create(user=user, **validated_data)
    # First creation doesn't necessarily mean progress; keep XP neutral.
    return skill


@transaction.atomic
def update_skill(*, skill: Skill, validated_data: dict) -> Skill:
    skill = Skill.objects.select_for_update().get(pk=skill.pk)
    before_level = int(skill.level)
    before_status = skill.status

    for field, value in validated_data.items():
        if field == "level" and getattr(skill, "node_id", None):
            max_level = int(getattr(skill.node, "max_level", 100) or 100)
            value = min(int(value), max_level)
        setattr(skill, field, value)

    skill.save()

    gained = 0
    after_level = int(skill.level)
    if after_level > before_level:
        gained += (after_level - before_level) * 2

    if before_status != Skill.Status.MASTERED and skill.status == Skill.Status.MASTERED:
        gained += 100

    # События делаем детерминированными, чтобы повторный запрос не дублировал XP.
    if after_level > before_level:
        award_xp_event(
            user=skill.user,
            kind=XPEvent.Kind.SKILL_LEVEL_UP,
            amount=(after_level - before_level) * 2,
            source_type="skill_level_up",
            source_id=f"{skill.id}:{before_level}->{after_level}",
            metadata={
                "skill_id": int(skill.id),
                "before_level": before_level,
                "after_level": after_level,
                "name": skill.name,
                "category": getattr(skill, "category", ""),
            },
            occurred_at=skill.updated_at,
        )

    if before_status != Skill.Status.MASTERED and skill.status == Skill.Status.MASTERED:
        award_xp_event(
            user=skill.user,
            kind=XPEvent.Kind.SKILL_MASTERED,
            amount=100,
            source_type="skill_mastered",
            source_id=str(skill.id),
            metadata={
                "skill_id": int(skill.id),
                "name": skill.name,
                "category": getattr(skill, "category", ""),
            },
            occurred_at=skill.updated_at,
        )

    return skill
