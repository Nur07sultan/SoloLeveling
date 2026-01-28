from __future__ import annotations

from rest_framework import serializers

from .models import FinanceRecord


class FinanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceRecord
        fields = (
            "id",
            "type",
            "amount",
            "category",
            "date",
            "description",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        return FinanceRecord.objects.create(user=self.context["request"].user, **validated_data)
