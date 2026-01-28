from __future__ import annotations

from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User(username=validated_data["username"], email=validated_data["email"])
        user.set_password(validated_data["password"])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField(help_text="Email или username")
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login = (attrs.get("login") or "").strip()
        password = attrs.get("password")

        username = login
        if "@" in login:
            try:
                username = User.objects.get(email__iexact=login).username
            except User.DoesNotExist:
                username = "__no_such_user__"

        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError({"non_field_errors": ["Неверный логин или пароль"]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": ["Пользователь не активен"]})
        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    nickname = serializers.CharField(source="username")
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("nickname", "email", "title", "bio", "avatar_url")

    def get_avatar_url(self, obj: User) -> str:
        if not obj.avatar:
            return ""
        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url

    def validate_nickname(self, value: str) -> str:
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Никнейм не может быть пустым")
        return value

    def update(self, instance: User, validated_data: dict):
        # username приходит как nickname через source.
        instance.username = validated_data.get("username", instance.username)
        instance.title = validated_data.get("title", instance.title)
        instance.bio = validated_data.get("bio", instance.bio)
        instance.save(update_fields=["username", "title", "bio"])
        return instance


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        # Дополнительно можно будет добавить ресайз/кроп на бэке.
        max_mb = 5
        if value.size > max_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Файл слишком большой (макс. {max_mb} МБ)")
        return value
