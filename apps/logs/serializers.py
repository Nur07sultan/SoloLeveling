from __future__ import annotations

from rest_framework import serializers

from .models import LearningLog
from .services import create_learning_log


class LearningLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningLog
        fields = ("id", "title", "description", "date", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        return create_learning_log(user=self.context["request"].user, validated_data=validated_data)
