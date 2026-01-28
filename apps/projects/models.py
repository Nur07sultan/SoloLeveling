from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class Project(models.Model):
	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
	name = models.CharField(max_length=128)
	is_commercial = models.BooleanField(default=False)
	description = models.TextField(blank=True)
	stack = models.CharField(max_length=256, blank=True, default="")
	role = models.CharField(max_length=128, blank=True, default="")

	class Status(models.TextChoices):
		ACTIVE = "active", "Активен"
		PAUSED = "paused", "Пауза"
		DONE = "done", "Завершён"

	status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["-id"]
		unique_together = [("user", "name")]

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id} {self.name}"


class Task(models.Model):
	class Type(models.TextChoices):
		DAILY = "daily", "Ежедневный"
		MAIN = "main", "Основной"
		INTERNSHIP = "internship", "Стажировка"

	class Status(models.TextChoices):
		TODO = "todo", "Todo"
		IN_PROGRESS = "in_progress", "In progress"
		DONE = "done", "Done"

	project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
	title = models.CharField(max_length=256)
	type = models.CharField(max_length=16, choices=Type.choices, default=Type.MAIN)
	status = models.CharField(max_length=16, choices=Status.choices, default=Status.TODO)
	difficulty = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
	deadline = models.DateField(null=True, blank=True)
	notes = models.TextField(blank=True)
	completed_at = models.DateTimeField(null=True, blank=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-id"]

	def mark_completed(self):
		self.status = Task.Status.DONE
		self.completed_at = timezone.now()
		self.save(update_fields=["status", "completed_at", "updated_at"])

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.project_id} {self.title}"
