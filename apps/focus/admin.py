from __future__ import annotations

from django.contrib import admin

from .models import FocusSession


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "kind",
        "started_at",
        "ended_at",
        "duration_seconds",
        "xp_awarded",
        "canceled",
    )
    list_filter = ("kind", "canceled")
    search_fields = ("user__username", "note")
