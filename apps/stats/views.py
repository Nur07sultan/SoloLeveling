from __future__ import annotations

from datetime import datetime, time, timedelta

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import XPEvent
from .serializers import AllocateStatsSerializer, AnalyticsSummarySerializer, HeroStatsSerializer
from .services import allocate_stat_points, ensure_user_stats


class HeroAPIView(APIView):
    serializer_class = HeroStatsSerializer

    def get(self, request):
        stats = ensure_user_stats(request.user)
        return Response(HeroStatsSerializer(stats).data)


class HeroAllocateAPIView(APIView):
	serializer_class = AllocateStatsSerializer

	def post(self, request):
		serializer = AllocateStatsSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		try:
			stats = allocate_stat_points(user=request.user, delta=serializer.validated_data)
		except ValueError as e:
			raise ValidationError({"non_field_errors": [str(e)]})
		return Response(HeroStatsSerializer(stats).data)


class AnalyticsSummaryAPIView(APIView):
	serializer_class = AnalyticsSummarySerializer

	def get(self, request):
		# Последние 30 дней по событиям XP (честный источник)
		today = timezone.localdate()
		start_day = today - timedelta(days=29)
		start_dt = timezone.make_aware(datetime.combine(start_day, time.min))

		base_qs = XPEvent.objects.filter(user=request.user, created_at__gte=start_dt)

		by_day = (
			base_qs.annotate(day=TruncDate("created_at"))
			.values("day")
			.annotate(xp=Sum("amount"))
			.order_by("day")
		)
		xp_by_day = [{"date": str(x["day"]), "xp": int(x["xp"] or 0)} for x in by_day]

		by_kind = base_qs.values("kind").annotate(xp=Sum("amount")).order_by("-xp")
		xp_by_kind = [{"kind": x["kind"], "xp": int(x["xp"] or 0)} for x in by_kind]

		# Streak: сколько дней подряд до сегодня (включая) был XP>0
		day_to_xp = {x["date"]: x["xp"] for x in xp_by_day}
		streak_current = 0
		for i in range(0, 365):
			d = today - timedelta(days=i)
			key = str(d)
			if day_to_xp.get(key, 0) > 0:
				streak_current += 1
			else:
				break

		# Best streak за 30 дней
		best = 0
		cur = 0
		for i in range(29, -1, -1):
			d = today - timedelta(days=i)
			key = str(d)
			if day_to_xp.get(key, 0) > 0:
				cur += 1
				best = max(best, cur)
			else:
				cur = 0

		return Response(
			{
				"xp_by_day": xp_by_day,
				"xp_by_kind": xp_by_kind,
				"streak_current": int(streak_current),
				"streak_best_30d": int(best),
			}
		)
