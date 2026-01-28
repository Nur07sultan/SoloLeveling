from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.skills.models import SkillNode


class FocusSession(models.Model):

    class Kind(models.TextChoices):
        CODING = "coding", "Кодинг"
        LEARNING = "learning", "Обучение"
        DEBUGGING = "debugging", "Отладка"
        READING = "reading", "Чтение документации"
        REVIEW = "review", "Код-ревью"
        INTERVIEW = "interview", "Подготовка к собеседованию"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="focus_sessions")
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.CODING)
    note = models.CharField(max_length=256, blank=True, default="")

    skill_node = models.ForeignKey(
        SkillNode,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="focus_sessions",
    )

    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    canceled = models.BooleanField(default=False)

    duration_seconds = models.PositiveIntegerField(default=0)
    xp_awarded = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Фокус-сессия"
        verbose_name_plural = "Фокус-сессии"
        ordering = ["-started_at", "-id"]
        indexes = [
            models.Index(fields=["user", "started_at"]),
            models.Index(fields=["user", "ended_at"]),
            models.Index(fields=["user", "canceled", "ended_at"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                name="uniq_active_focus_session_per_user",
                condition=models.Q(ended_at__isnull=True) & models.Q(canceled=False),
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"FocusSession(user={self.user_id}, kind={self.kind}, started_at={self.started_at})"
