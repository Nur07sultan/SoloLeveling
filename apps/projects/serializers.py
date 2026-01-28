from __future__ import annotations

from rest_framework import serializers

from .models import Project, Task
from .services import create_project, create_task


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "is_commercial",
            "description",
            "stack",
            "role",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        return create_project(user=self.context["request"].user, validated_data=validated_data)


class TaskSerializer(serializers.ModelSerializer):
    xp_reward = serializers.SerializerMethodField()
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.none())

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "title",
            "type",
            "status",
            "difficulty",
            "xp_reward",
            "deadline",
            "notes",
            "completed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")

    def get_xp_reward(self, obj) -> int:
        return int(obj.difficulty) * 50

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            self.fields["project"].queryset = Project.objects.filter(user=request.user)

    def create(self, validated_data):
        return create_task(user=self.context["request"].user, validated_data=validated_data)


class TaskCompleteSerializer(serializers.Serializer):
    # Reserved for future: notes, spent_time, etc.
    pass
