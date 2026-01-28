from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Workout(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workouts")
	type = models.CharField(max_length=64)
	duration = models.PositiveIntegerField(help_text="Минуты")
	intensity = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(10)])
	date = models.DateField(default=timezone.localdate)
	comment = models.TextField(blank=True)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-date", "-id"]

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id} {self.type} {self.duration}m x{self.intensity}"
