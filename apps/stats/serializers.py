from __future__ import annotations

from rest_framework import serializers

from .models import UserStats


class HeroStatsSerializer(serializers.ModelSerializer):
	class Meta:
		model = UserStats
		fields = (
			"level",
			"xp",
			"xp_to_next_level",
			"rank",
			"dev_score",
			"strength",
			"agility",
			"intelligence",
			"vitality",
			"stat_points",
		)


class AllocateStatsSerializer(serializers.Serializer):
	strength = serializers.IntegerField(required=False, min_value=0, max_value=999)
	agility = serializers.IntegerField(required=False, min_value=0, max_value=999)
	intelligence = serializers.IntegerField(required=False, min_value=0, max_value=999)
	vitality = serializers.IntegerField(required=False, min_value=0, max_value=999)

	def validate(self, attrs):
		# Нельзя отправлять пустой запрос.
		if not attrs:
			raise serializers.ValidationError({"non_field_errors": ["Укажите, куда распределить очки"]})
		return attrs

class AnalyticsSummarySerializer(serializers.Serializer):
	# Последние N дней
	xp_by_day = serializers.ListField(child=serializers.DictField(), read_only=True)
	xp_by_kind = serializers.ListField(child=serializers.DictField(), read_only=True)
	streak_current = serializers.IntegerField(read_only=True)
	streak_best_30d = serializers.IntegerField(read_only=True)
