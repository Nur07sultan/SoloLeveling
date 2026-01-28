from __future__ import annotations

from django.conf import settings
from django.db import models


class AIProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ai_profile")

    preferred_name = models.CharField(max_length=128, blank=True, default="")
    how_to_address = models.CharField(
        max_length=128,
        blank=True,
        default="",
        help_text="Как ассистент должен к тебе обращаться (например: 'Нурс', 'господин Нурсултан', 'брат').",
    )
    about_me = models.TextField(blank=True, default="", help_text="Факты о тебе, которые можно использовать в ответах")
    assistant_persona = models.TextField(
        blank=True,
        default="",
        help_text="Характер/стиль ассистента (тон, краткость, правила общения).",
    )

    # Для доп. фактов/настроек (можно использовать позже)
    extra = models.JSONField(blank=True, default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль ИИ"
        verbose_name_plural = "Профили ИИ"

    def __str__(self) -> str:  # pragma: no cover
        return f"AIProfile(user_id={self.user_id})"
