from __future__ import annotations

from rest_framework import serializers


class AIChatSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000)
    history = serializers.ListField(child=serializers.DictField(), required=False)


class AIActSerializer(serializers.Serializer):
    action_token = serializers.CharField()


class AIProfileSerializer(serializers.Serializer):
    preferred_name = serializers.CharField(max_length=128, required=False, allow_blank=True)
    how_to_address = serializers.CharField(max_length=128, required=False, allow_blank=True)
    about_me = serializers.CharField(required=False, allow_blank=True)
    assistant_persona = serializers.CharField(required=False, allow_blank=True)
