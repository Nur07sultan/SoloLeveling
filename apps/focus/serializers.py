from __future__ import annotations

from rest_framework import serializers

from apps.skills.models import SkillNode

from .models import FocusSession


class FocusSessionSerializer(serializers.ModelSerializer):

    skill_node_title = serializers.CharField(source="skill_node.title", read_only=True)
    track_title = serializers.CharField(source="skill_node.track.title", read_only=True)

    class Meta:
        model = FocusSession
        fields = (
            "id",
            "kind",
            "note",
            "skill_node",
            "skill_node_title",
            "track_title",
            "started_at",
            "ended_at",
            "canceled",
            "duration_seconds",
            "xp_awarded",
            "created_at",
        )
        read_only_fields = (
            "id",
            "started_at",
            "ended_at",
            "canceled",
            "duration_seconds",
            "xp_awarded",
            "created_at",
            "skill_node_title",
            "track_title",
        )


class FocusStartSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=FocusSession.Kind.choices, required=False)
    note = serializers.CharField(required=False, allow_blank=True, max_length=256)
    skill_node = serializers.PrimaryKeyRelatedField(queryset=SkillNode.objects.all(), required=False, allow_null=True)


class FocusStopSerializer(serializers.Serializer):
    # На будущее: можно будет отправлять подтверждение/ссылку на PR.
    source_url = serializers.URLField(required=False, allow_blank=True)
