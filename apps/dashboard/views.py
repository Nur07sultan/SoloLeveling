from __future__ import annotations

from datetime import timedelta

from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.finance.services import get_balance
from apps.projects.models import Task
from apps.skills.models import Skill
from apps.stats.models import UserStats
from .serializers import DashboardSerializer


class DashboardAPIView(APIView):
	serializer_class = DashboardSerializer

	def get(self, request):
		stats = UserStats.objects.get(user=request.user)

		today = timezone.localdate()
		week_start = today - timedelta(days=today.weekday())

		workouts_this_week = request.user.workouts.filter(date__gte=week_start, date__lte=today).count()
		tasks_done = Task.objects.filter(project__user=request.user, status=Task.Status.DONE).count()
		skills_in_progress = Skill.objects.filter(
			user=request.user, status__in=[Skill.Status.LEARNING, Skill.Status.PRACTICING]
		).count()

		balance = get_balance(user=request.user)

		return Response(
			{
				"level": stats.level,
				"xp": stats.xp,
				"rank": stats.rank,
				"dev_score": stats.dev_score,
				"balance": float(balance),
				"workouts_this_week": workouts_this_week,
				"tasks_done": tasks_done,
				"skills_in_progress": skills_in_progress,
			}
		)
