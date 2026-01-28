from __future__ import annotations

from rest_framework import serializers

from .models import Workout


class WorkoutSerializer(serializers.ModelSerializer):
    xp_reward = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = ("id", "type", "duration", "intensity", "date", "comment", "xp_reward", "created_at")
        read_only_fields = ("id", "created_at")

    def get_xp_reward(self, obj) -> int:
        return int(obj.duration) * int(obj.intensity)
