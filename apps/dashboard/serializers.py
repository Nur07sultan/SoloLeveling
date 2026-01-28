from __future__ import annotations

from rest_framework import serializers


class DashboardSerializer(serializers.Serializer):
    level = serializers.IntegerField()
    xp = serializers.IntegerField()
    rank = serializers.CharField()
    dev_score = serializers.IntegerField()
    balance = serializers.FloatField()
    workouts_this_week = serializers.IntegerField()
    tasks_done = serializers.IntegerField()
    skills_in_progress = serializers.IntegerField()
