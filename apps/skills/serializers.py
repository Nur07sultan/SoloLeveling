from __future__ import annotations

from rest_framework import serializers

from .models import Skill
from .services import create_skill, update_skill


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ("id", "node", "category", "name", "level", "mastery_xp", "status", "created_at", "updated_at")
        read_only_fields = ("id", "status", "mastery_xp", "created_at", "updated_at")

    def create(self, validated_data):
        return create_skill(user=self.context["request"].user, validated_data=validated_data)

    def update(self, instance, validated_data):
        return update_skill(skill=instance, validated_data=validated_data)
