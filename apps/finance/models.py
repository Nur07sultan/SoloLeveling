from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class FinanceRecord(models.Model):
	class Type(models.TextChoices):
		INCOME = "income", "Income"
		EXPENSE = "expense", "Expense"

	user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="finance_records")
	type = models.CharField(max_length=7, choices=Type.choices)
	amount = models.DecimalField(max_digits=12, decimal_places=2)
	category = models.CharField(max_length=64)
	date = models.DateField(default=timezone.localdate)
	description = models.TextField(blank=True)

	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-date", "-id"]

	def __str__(self) -> str:  # pragma: no cover
		return f"{self.user_id} {self.type} {self.amount}"
