from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AvatarUploadSerializer, LoginSerializer, ProfileSerializer, RegisterSerializer


class RegisterAPIView(APIView):
	permission_classes = [permissions.AllowAny]
	serializer_class = RegisterSerializer

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.save()
		token, _ = Token.objects.get_or_create(user=user)

		return Response(
			{
				"token": token.key,
				"user": {"id": user.id, "username": user.username, "email": user.email},
			},
			status=status.HTTP_201_CREATED,
		)


class LoginAPIView(APIView):
	permission_classes = [permissions.AllowAny]
	serializer_class = LoginSerializer

	def post(self, request):
		serializer = LoginSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user = serializer.validated_data["user"]
		token, _ = Token.objects.get_or_create(user=user)
		return Response(
			{
				"token": token.key,
				"user": {"id": user.id, "username": user.username, "email": user.email},
			}
		)


class LogoutAPIView(APIView):
	serializer_class = None
	def post(self, request):
		Token.objects.filter(user=request.user).delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileAPIView(APIView):
	serializer_class = ProfileSerializer

	def get(self, request):
		from apps.projects.models import Project
		from apps.skills.models import Skill
		from apps.stats.models import UserStats

		stats = UserStats.objects.get(user=request.user)
		key_skills = list(
			Skill.objects.filter(user=request.user).order_by("-level", "name").values("id", "name", "level", "status")[:5]
		)
		active_projects = list(
			Project.objects.filter(user=request.user).order_by("-id").values("id", "name", "is_commercial")[:5]
		)

		profile = ProfileSerializer(instance=request.user, context={"request": request}).data
		return Response(
			{
				**profile,
				"rank": stats.rank,
				"level": stats.level,
				"xp": stats.xp,
				"key_skills": key_skills,
				"active_projects": active_projects,
			}
		)

	def patch(self, request):
		serializer = ProfileSerializer(instance=request.user, data=request.data, partial=True, context={"request": request})
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data)


class AvatarAPIView(APIView):
	serializer_class = AvatarUploadSerializer

	def post(self, request):
		serializer = AvatarUploadSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		request.user.avatar = serializer.validated_data["avatar"]
		request.user.save(update_fields=["avatar"])
		return Response(ProfileSerializer(instance=request.user, context={"request": request}).data)

	def delete(self, request):
		# Удаляем файл и ссылку.
		if request.user.avatar:
			request.user.avatar.delete(save=False)
		request.user.avatar = None
		request.user.save(update_fields=["avatar"])
		return Response(status=status.HTTP_204_NO_CONTENT)
