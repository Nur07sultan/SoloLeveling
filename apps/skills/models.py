from __future__ import annotations

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SkillTrack(models.Model):
	code = models.SlugField(max_length=32, unique=True)
	title = models.CharField(max_length=64)
	order = models.PositiveIntegerField(default=0)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["order", "title", "id"]
		verbose_name = "Трек навыков"
		verbose_name_plural = "Треки навыков"

	def __str__(self) -> str:  # pragma: no cover
		return self.title


class SkillNode(models.Model):
	track = models.ForeignKey(SkillTrack, on_delete=models.CASCADE, related_name="nodes")
	code = models.SlugField(max_length=64, unique=True)
	title = models.CharField(max_length=128)
	description = models.TextField(blank=True, default="")
	max_level = models.PositiveIntegerField(default=100)
	order = models.PositiveIntegerField(default=0)
	prerequisites = models.ManyToManyField("self", blank=True, symmetrical=False, related_name="unlocks")

	class Meta:
		ordering = ["track__order", "track__title", "order", "title", "id"]
		verbose_name = "Узел навыка"
		verbose_name_plural = "Узлы навыков"

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.track.title}: {self.title}"


class Skill(models.Model):
	class Status(models.TextChoices):
		LEARNING = "learning", "Изучаю"
		PRACTICING = "practicing", "Практикую"
		MASTERED = "mastered", "Освоено"

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="skills")
	node = models.ForeignKey(SkillNode, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_skills")
	category = models.CharField(max_length=64, blank=True, default="")
	name = models.CharField(max_length=128)
	level = models.PositiveIntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)], default=0)
	mastery_xp = models.PositiveIntegerField(default=0)
	status = models.CharField(max_length=16, choices=Status.choices, default=Status.LEARNING)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = [("user", "category", "name")]
		ordering = ["-level", "name", "id"]
		constraints = [
			models.UniqueConstraint(
				fields=["user", "node"],
				name="uniq_skill_node_per_user",
				condition=models.Q(node__isnull=False),
			),
		]

	@staticmethod
	def status_for_level(level: int) -> str:
		if level >= 80:
			return Skill.Status.MASTERED
		if level >= 40:
			return Skill.Status.PRACTICING
		return Skill.Status.LEARNING

	def save(self, *args, **kwargs):
		self.status = self.status_for_level(int(self.level))
		return super().save(*args, **kwargs)

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id} {self.name} {self.level}"
