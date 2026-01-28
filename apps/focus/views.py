from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import FocusSession
from .serializers import FocusSessionSerializer, FocusStartSerializer, FocusStopSerializer
from .services import cancel_focus_session, start_focus_session, stop_focus_session


class FocusSessionViewSet(viewsets.GenericViewSet):

    serializer_class = FocusSessionSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        request = getattr(self, "request", None)
        user = getattr(request, "user", None)
        if not user or not getattr(user, "is_authenticated", False):
            return FocusSession.objects.none()
        return FocusSession.objects.filter(user=user).select_related("skill_node", "skill_node__track")

    def list(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        obj = self.get_queryset().filter(ended_at__isnull=True, canceled=False).first()
        if not obj:
            return Response(None)
        return Response(self.get_serializer(obj).data)

    @action(detail=False, methods=["post"], url_path="start")
    def start(self, request):
        serializer = FocusStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        kind = serializer.validated_data.get("kind") or FocusSession.Kind.CODING
        note = serializer.validated_data.get("note") or ""
        skill_node = serializer.validated_data.get("skill_node")

        obj, created = start_focus_session(
            user=request.user,
            kind=kind,
            note=note,
            skill_node_id=getattr(skill_node, "id", None),
        )
        return Response(
            self.get_serializer(obj).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="stop")
    def stop(self, request):
        serializer = FocusStopSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source_url = serializer.validated_data.get("source_url") or ""
        obj, xp = stop_focus_session(user=request.user, source_url=source_url)
        if not obj:
            raise ValidationError({"non_field_errors": ["Активная фокус-сессия не найдена"]})
        return Response({"session": self.get_serializer(obj).data, "xp_awarded": xp})

    @action(detail=False, methods=["post"], url_path="cancel")
    def cancel(self, request):
        obj = cancel_focus_session(user=request.user)
        if not obj:
            raise ValidationError({"non_field_errors": ["Активная фокус-сессия не найдена"]})
        return Response(self.get_serializer(obj).data)
