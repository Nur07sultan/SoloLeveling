from __future__ import annotations

from rest_framework import serializers

from .models import BossRun


class BossRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = BossRun
        fields = (
            "id",
            "name",
            "rank",
            "hp_max",
            "hp_current",
            "status",
            "started_at",
            "defeated_at",
        )


class BossAttackSerializer(serializers.Serializer):
    # Сколько XP-событий максимум можно "поглотить" за один вызов.
    max_events = serializers.IntegerField(required=False, min_value=1, max_value=500)
