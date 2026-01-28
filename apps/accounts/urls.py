from django.urls import path

from .views import AvatarAPIView, LoginAPIView, LogoutAPIView, ProfileAPIView, RegisterAPIView

urlpatterns = [
    path("auth/register/", RegisterAPIView.as_view(), name="auth-register"),
    path("auth/login/", LoginAPIView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutAPIView.as_view(), name="auth-logout"),
    path("profile/", ProfileAPIView.as_view(), name="profile"),
    path("profile/avatar/", AvatarAPIView.as_view(), name="profile-avatar"),
]
