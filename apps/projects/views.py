from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Project, Task
from .serializers import ProjectSerializer, TaskCompleteSerializer, TaskSerializer
from .services import complete_task


class ProjectViewSet(viewsets.ModelViewSet):
	serializer_class = ProjectSerializer
	http_method_names = ["get", "post", "head", "options"]

	def get_queryset(self):
		request = getattr(self, "request", None)
		user = getattr(request, "user", None)
		if not user or not getattr(user, "is_authenticated", False):
			return Project.objects.none()
		return Project.objects.filter(user=user)


class TaskViewSet(viewsets.ModelViewSet):
	serializer_class = TaskSerializer
	http_method_names = ["get", "post", "head", "options"]

	def get_queryset(self):
		request = getattr(self, "request", None)
		user = getattr(request, "user", None)
		if not user or not getattr(user, "is_authenticated", False):
			return Task.objects.none()

		qs = Task.objects.filter(project__user=user).select_related("project")
		query_params = getattr(request, "query_params", {}) or {}
		project_id = query_params.get("project")
		if project_id:
			qs = qs.filter(project_id=project_id)
		return qs

	@action(detail=True, methods=["post"], url_path="complete")
	def complete(self, request, pk=None):
		task = self.get_object()
		serializer = TaskCompleteSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		task = complete_task(task=task)
		return Response(self.get_serializer(task).data, status=status.HTTP_200_OK)
