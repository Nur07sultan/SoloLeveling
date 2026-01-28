from __future__ import annotations

from django.contrib import admin

from .models import BossDamage, BossRun


@admin.register(BossRun)
class BossRunAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "rank", "hp_current", "hp_max", "status", "started_at", "defeated_at")
    list_filter = ("rank", "status")
    search_fields = ("user__username", "name")


@admin.register(BossDamage)
class BossDamageAdmin(admin.ModelAdmin):
    list_display = ("id", "boss", "xp_event", "amount", "created_at")
    search_fields = ("boss__name", "boss__user__username")
