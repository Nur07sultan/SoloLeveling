from __future__ import annotations

from decimal import Decimal

from django.db.models import Sum

from .models import FinanceRecord


def get_balance(*, user) -> Decimal:
    income = (
        FinanceRecord.objects.filter(user=user, type=FinanceRecord.Type.INCOME).aggregate(v=Sum("amount")).get("v")
        or Decimal("0")
    )
    expense = (
        FinanceRecord.objects.filter(user=user, type=FinanceRecord.Type.EXPENSE).aggregate(v=Sum("amount")).get("v")
        or Decimal("0")
    )
    return income - expense
