from __future__ import annotations

from rest_framework import serializers


class SystemSerializer(serializers.Serializer):
    ranks = serializers.ListField(child=serializers.DictField())
    xp_rules = serializers.DictField()
