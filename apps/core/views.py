from __future__ import annotations

from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import SystemSerializer


class SystemAPIView(APIView):
	"""Константы/правила системы для фронтенда (read-only)."""

	authentication_classes = []
	permission_classes = []
	serializer_class = SystemSerializer

	def get(self, request):
		return Response(
			{
				"ranks": [
					{"code": "E", "title": "Новичок", "min_dev_score": 0},
					{"code": "D", "title": "Junior", "min_dev_score": 500},
					{"code": "C", "title": "Junior+", "min_dev_score": 1500},
					{"code": "B", "title": "Middle", "min_dev_score": 3000},
					{"code": "A", "title": "Middle+", "min_dev_score": 6000},
					{"code": "S", "title": "Senior", "min_dev_score": 10000},
				],
				"xp_rules": {
					"level_formula": "xp_to_next_level = level * 100",
					"task": {"formula": "difficulty * 50"},
					"workout": {"formula": "duration * intensity"},
					"learning_log": {"fixed": 25},
					"skill": {"per_level": 2, "mastered_bonus": 100},
				},
			}
		)
