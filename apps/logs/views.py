from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import LearningLog
from .serializers import LearningLogSerializer
from .services import create_learning_log


class LearningLogViewSet(viewsets.GenericViewSet):
	serializer_class = LearningLogSerializer
	http_method_names = ["get", "post", "head", "options"]

	def get_queryset(self):
		return LearningLog.objects.filter(user=self.request.user)

	def list(self, request):
		serializer = self.get_serializer(self.get_queryset(), many=True)
		return Response(serializer.data)

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		obj = create_learning_log(user=request.user, validated_data=serializer.validated_data)
		return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)
