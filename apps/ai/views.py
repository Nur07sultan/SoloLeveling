from __future__ import annotations

import os

from django.core import signing
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .actions import execute_action, extract_action_from_text, list_actions
from .ollama import OllamaError, ollama_chat
from .serializers import AIActSerializer, AIChatSerializer, AIProfileSerializer

from .models import AIProfile


def _get_or_create_profile(user) -> AIProfile:
    obj = getattr(user, "ai_profile", None)
    if obj:
        return obj
    return AIProfile.objects.create(user=user)


def _safe_history(raw) -> list[dict]:
    if not raw:
        return []
    if not isinstance(raw, list):
        return []

    out: list[dict] = []
    for item in raw[-10:]:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "")
        content = str(item.get("content") or "")
        if role not in {"user", "assistant", "system"}:
            continue
        if not content:
            continue
        out.append({"role": role, "content": content[:2000]})
    return out


class AIChatAPIView(APIView):
    serializer_class = AIChatSerializer

    def post(self, request):
        serializer = AIChatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_text = serializer.validated_data["message"].strip()
        history = _safe_history(serializer.validated_data.get("history"))

        model = os.getenv("OLLAMA_MODEL") or "qwen2.5:1.5b"

        profile = _get_or_create_profile(request.user)
        preferred_name = (profile.preferred_name or "").strip()
        how_to_address = (profile.how_to_address or "").strip()
        about_me = (profile.about_me or "").strip()
        persona = (profile.assistant_persona or "").strip()

        tools = "\n".join([f"- {a['name']}: {a['description']}" for a in list_actions()])
        memory_block = ""
        if preferred_name or how_to_address or about_me:
            memory_block = (
                "\n\nПамять о пользователе (это правда, используй аккуратно):\n"
                + (f"- Имя/предпочтительное имя: {preferred_name}\n" if preferred_name else "")
                + (f"- Как обращаться: {how_to_address}\n" if how_to_address else "")
                + (f"- Факты: {about_me}\n" if about_me else "")
            )

        persona_block = ""
        if persona:
            persona_block = "\n\nСтиль ассистента (следуй этому):\n" + persona

        system = (
            "Ты — ИИ ассистент для Solo Dev System. Отвечай по-русски. "
            "Ты можешь предлагать безопасные действия ТОЛЬКО из списка команд ниже. "
            "Если нужно выполнить действие — добавь в конце сообщения блок вида:\n"
            "```action\n{\"name\": \"<command>\", \"args\": {...}}\n```\n"
            "Если действие не нужно — не добавляй блок action.\n\n"
            f"Доступные команды:\n{tools}\n"
            + memory_block
            + persona_block
        )

        messages = [{"role": "system", "content": system}, *history, {"role": "user", "content": user_text}]

        try:
            answer = ollama_chat(model=model, messages=messages)
        except OllamaError as e:
            raise ValidationError({"non_field_errors": [str(e)]})

        clean_text, action = extract_action_from_text(answer)

        action_token = None
        if action:
            # НЕ выполняем автоматически. Только подписываем предложение.
            try:
                action_token = signing.dumps(action, salt="ai-action")
            except Exception:
                action_token = None

        return Response(
            {
                "reply": clean_text,
                "proposed_action": action,
                "action_token": action_token,
                "model": model,
            },
            status=status.HTTP_200_OK,
        )


class AIActAPIView(APIView):
    serializer_class = AIActSerializer

    def post(self, request):
        serializer = AIActSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data["action_token"]
        try:
            action = signing.loads(token, salt="ai-action", max_age=300)  # 5 минут на подтверждение
        except signing.SignatureExpired:
            raise ValidationError({"non_field_errors": ["Команда устарела, запроси её заново"]})
        except signing.BadSignature:
            raise ValidationError({"non_field_errors": ["Некорректная подпись команды"]})

        result = execute_action(user=request.user, action=action)
        return Response({"result": result, "action": action}, status=status.HTTP_200_OK)


class AIProfileAPIView(APIView):
    serializer_class = AIProfileSerializer

    def get(self, request):
        profile = _get_or_create_profile(request.user)
        data = {
            "preferred_name": profile.preferred_name,
            "how_to_address": profile.how_to_address,
            "about_me": profile.about_me,
            "assistant_persona": profile.assistant_persona,
        }
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = _get_or_create_profile(request.user)
        serializer = AIProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        profile.preferred_name = v.get("preferred_name", profile.preferred_name)
        profile.how_to_address = v.get("how_to_address", profile.how_to_address)
        profile.about_me = v.get("about_me", profile.about_me)
        profile.assistant_persona = v.get("assistant_persona", profile.assistant_persona)
        profile.save(update_fields=["preferred_name", "how_to_address", "about_me", "assistant_persona", "updated_at"])

        return Response(
            {
                "preferred_name": profile.preferred_name,
                "how_to_address": profile.how_to_address,
                "about_me": profile.about_me,
                "assistant_persona": profile.assistant_persona,
            },
            status=status.HTTP_200_OK,
        )
