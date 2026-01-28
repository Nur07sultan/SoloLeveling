from __future__ import annotations

from rest_framework import serializers, viewsets

from .models import Skill, SkillNode, SkillTrack
from .serializers import SkillSerializer


class SkillViewSet(viewsets.ModelViewSet):
	serializer_class = SkillSerializer
	http_method_names = ["get", "post", "patch", "head", "options"]

	def get_queryset(self):
		request = getattr(self, "request", None)
		user = getattr(request, "user", None)
		if not user or not getattr(user, "is_authenticated", False):
			return Skill.objects.none()
		return Skill.objects.filter(user=user)


class SkillTrackListSerializer(serializers.ModelSerializer):
	class Meta:
		model = SkillTrack
		fields = ("id", "code", "title", "order")


class SkillNodeListSerializer(serializers.ModelSerializer):
	track = SkillTrackListSerializer(read_only=True)
	prerequisites = serializers.PrimaryKeyRelatedField(read_only=True, many=True)

	class Meta:
		model = SkillNode
		fields = ("id", "track", "code", "title", "description", "max_level", "order", "prerequisites")


class SkillTrackViewSet(viewsets.ReadOnlyModelViewSet):
	serializer_class = SkillTrackListSerializer
	http_method_names = ["get", "head", "options"]

	def get_queryset(self):
		return SkillTrack.objects.all()


class SkillNodeViewSet(viewsets.ReadOnlyModelViewSet):
	serializer_class = SkillNodeListSerializer
	http_method_names = ["get", "head", "options"]

	def get_queryset(self):
		return SkillNode.objects.select_related("track").prefetch_related("prerequisites").all()
