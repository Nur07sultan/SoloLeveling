from __future__ import annotations

from django.conf import settings
from django.db import models

from apps.stats.models import XPEvent


class BossRun(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Активен"
        DEFEATED = "defeated", "Побеждён"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="boss_runs")

    name = models.CharField(max_length=128)
    rank = models.CharField(max_length=32, default="E")

    hp_max = models.PositiveIntegerField(default=1000)
    hp_current = models.PositiveIntegerField(default=1000)

    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)

    started_at = models.DateTimeField(auto_now_add=True)
    defeated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Босс (забег)"
        verbose_name_plural = "Боссы (забеги)"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                name="uniq_active_boss_per_user",
                condition=models.Q(status="active"),
            )
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"BossRun(user={self.user_id}, {self.name}, hp={self.hp_current}/{self.hp_max})"


class BossDamage(models.Model):
    boss = models.ForeignKey(BossRun, on_delete=models.CASCADE, related_name="damages")
    xp_event = models.OneToOneField(XPEvent, on_delete=models.CASCADE, related_name="boss_damage")
    amount = models.PositiveIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Урон боссу"
        verbose_name_plural = "Урон боссу"
        ordering = ["-id"]

    def __str__(self) -> str:  # pragma: no cover
        return f"BossDamage(boss={self.boss_id}, xp_event={self.xp_event_id}, amount={self.amount})"
