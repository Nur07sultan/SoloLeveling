from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class LearningLog(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="learning_logs")
	title = models.CharField(max_length=256)
	description = models.TextField(blank=True)
	date = models.DateField(default=timezone.localdate)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-date", "-id"]

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id} {self.title}"
