from __future__ import annotations

from django.conf import settings
from django.db import models


class Rank(models.TextChoices):
	E = "E", "Новичок"
	D = "D", "Junior"
	C = "C", "Junior+"
	B = "B", "Middle"
	A = "A", "Middle+"
	S = "S", "Senior"


class UserStats(models.Model):
	user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stats")

	level = models.PositiveIntegerField(default=1)
	xp = models.PositiveIntegerField(default=0)
	xp_to_next_level = models.PositiveIntegerField(default=100)

	# Характеристики героя (как в Solo Leveling), адаптировано под backend’ера.
	strength = models.PositiveIntegerField(default=1, verbose_name="Сила")
	agility = models.PositiveIntegerField(default=1, verbose_name="Ловкость")
	intelligence = models.PositiveIntegerField(default=1, verbose_name="Интеллект")
	vitality = models.PositiveIntegerField(default=1, verbose_name="Выносливость")
	stat_points = models.PositiveIntegerField(default=0, verbose_name="Свободные очки")

	dev_score = models.PositiveIntegerField(default=0)
	rank = models.CharField(max_length=1, choices=Rank.choices, default=Rank.E)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		verbose_name = "Статистика героя"
		verbose_name_plural = "Статистика героя"

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id}: L{self.level} XP{self.xp}"


class XPEvent(models.Model):
	class Kind(models.TextChoices):
		WORKOUT = "workout", "Тренировка"
		TASK_COMPLETE = "task_complete", "Завершение задачи"
		SKILL_LEVEL_UP = "skill_level_up", "Повышение уровня навыка"
		SKILL_MASTERED = "skill_mastered", "Навык освоен"
		LEARNING_LOG = "learning_log", "Запись обучения"
		FOCUS_SESSION = "focus_session", "Сессия фокуса"
		BOSS_DEFEAT = "boss_defeat", "Победа над боссом"
		GITHUB_COMMIT = "github_commit", "GitHub commit"
		GITHUB_PR = "github_pr", "GitHub PR"

	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="xp_events",
	)
	kind = models.CharField(max_length=32, choices=Kind.choices)
	amount = models.IntegerField()

	# Для "честной" прокачки: можно прикреплять подтверждение/источник.
	source_type = models.CharField(max_length=32, blank=True, default="")
	source_id = models.CharField(max_length=128, blank=True, default="")
	source_url = models.URLField(blank=True, default="")
	metadata = models.JSONField(default=dict, blank=True)

	occurred_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		verbose_name = "Событие опыта"
		verbose_name_plural = "События опыта"
		indexes = [
			models.Index(fields=["user", "created_at"]),
			models.Index(fields=["user", "kind", "created_at"]),
			models.Index(fields=["user", "source_type", "source_id"]),
		]
		constraints = [
			models.UniqueConstraint(
				fields=["user", "source_type", "source_id"],
				name="uniq_xp_event_source_per_user",
				condition=~models.Q(source_type="") & ~models.Q(source_id=""),
			),
		]

	def __str__(self) -> str:  # pragma: no cover
		return f"XPEvent(user={self.user_id}, kind={self.kind}, amount={self.amount})"
