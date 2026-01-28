from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.response import Response

from .models import Workout
from .serializers import WorkoutSerializer
from .services import create_workout


class WorkoutViewSet(viewsets.GenericViewSet):
	serializer_class = WorkoutSerializer
	http_method_names = ["get", "post", "head", "options"]

	def get_queryset(self):
		return Workout.objects.filter(user=self.request.user)

	def list(self, request):
		qs = self.get_queryset()
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data)

	def create(self, request):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		workout = create_workout(user=request.user, validated_data=serializer.validated_data)
		return Response(self.get_serializer(workout).data, status=status.HTTP_201_CREATED)
