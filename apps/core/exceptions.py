from __future__ import annotations

from rest_framework.views import exception_handler


def _normalize_errors(data):
    if data is None:
        return {"non_field_errors": ["Неизвестная ошибка"]}

    if isinstance(data, list):
        return {"non_field_errors": [str(x) for x in data]}

    if isinstance(data, dict):
        # Common DRF shape: {"detail": "..."}
        if set(data.keys()) == {"detail"}:
            return {"non_field_errors": [str(data["detail"])]}

        normalized = {}
        for field, messages in data.items():
            if isinstance(messages, list):
                normalized[field] = [str(x) for x in messages]
            else:
                normalized[field] = [str(messages)]
        return normalized

    return {"non_field_errors": [str(data)]}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    response.data = {
        "success": False,
        "data": None,
        "errors": _normalize_errors(getattr(response, "data", None)),
    }
    return response
