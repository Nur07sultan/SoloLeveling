from __future__ import annotations

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import BossAttackSerializer, BossRunSerializer
from .services import attack_boss, ensure_active_boss, start_next_boss


class BossAPIView(APIView):
    serializer_class = BossRunSerializer

    def get(self, request):
        boss = ensure_active_boss(user=request.user)
        return Response(BossRunSerializer(boss).data)


class BossAttackAPIView(APIView):
    serializer_class = BossAttackSerializer

    def post(self, request):
        serializer = BossAttackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        max_events = serializer.validated_data.get("max_events") or 200

        result = attack_boss(user=request.user, max_events=int(max_events))
        return Response(
            {
                "boss": BossRunSerializer(result["boss"]).data,
                "damage": result["damage"],
                "events_used": result["events_used"],
                "total_damage": result["total_damage"],
                "defeated": result["defeated"],
                "bonus_xp": result["bonus_xp"],
            },
            status=status.HTTP_200_OK,
        )


class BossNextAPIView(APIView):
    serializer_class = BossRunSerializer

    def post(self, request):
        boss = start_next_boss(user=request.user)
        return Response(BossRunSerializer(boss).data, status=status.HTTP_201_CREATED)
