from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
	fieldsets = UserAdmin.fieldsets
	add_fieldsets = UserAdmin.add_fieldsets
	list_display = ("id", "username", "email", "is_active", "is_staff")
	search_fields = ("username", "email")
