from __future__ import annotations

from rest_framework import viewsets

from .models import FinanceRecord
from .serializers import FinanceRecordSerializer


class FinanceRecordViewSet(viewsets.ModelViewSet):
	serializer_class = FinanceRecordSerializer
	http_method_names = ["get", "post", "patch", "delete", "head", "options"]

	def get_queryset(self):
		request = getattr(self, "request", None)
		user = getattr(request, "user", None)
		if not user or not getattr(user, "is_authenticated", False):
			return FinanceRecord.objects.none()
		return FinanceRecord.objects.filter(user=user)
