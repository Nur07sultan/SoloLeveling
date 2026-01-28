from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView
from rest_framework.routers import DefaultRouter

from apps.dashboard.views import DashboardAPIView
from apps.finance.views import FinanceRecordViewSet
from apps.logs.views import LearningLogViewSet
from apps.projects.views import ProjectViewSet, TaskViewSet
from apps.skills.views import SkillNodeViewSet, SkillTrackViewSet, SkillViewSet
from apps.workouts.views import WorkoutViewSet
from apps.core.views import SystemAPIView
from apps.stats.views import HeroAPIView, HeroAllocateAPIView
from apps.focus.views import FocusSessionViewSet
from apps.raids.views import BossAPIView, BossAttackAPIView, BossNextAPIView
from apps.stats.views import AnalyticsSummaryAPIView
from apps.ai.views import AIActAPIView, AIChatAPIView, AIProfileAPIView


class IntLookupRouter(DefaultRouter):
    # DRF will generate Django `path()` routes with converters instead of regex.
    # This allows OpenAPI generators to infer that `{id}`/`{pk}` is an integer.
    use_regex_path = False
    lookup_value_converter = "int"

router = IntLookupRouter()
router.register(r"finance", FinanceRecordViewSet, basename="finance")
router.register(r"workouts", WorkoutViewSet, basename="workouts")
router.register(r"skills", SkillViewSet, basename="skills")
router.register(r"skill-tracks", SkillTrackViewSet, basename="skill-tracks")
router.register(r"skill-nodes", SkillNodeViewSet, basename="skill-nodes")
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"tasks", TaskViewSet, basename="tasks")
router.register(r"logs", LearningLogViewSet, basename="logs")
router.register(r"focus", FocusSessionViewSet, basename="focus")

urlpatterns = [
    path("", include("apps.accounts.urls")),
    path("hero/", HeroAPIView.as_view(), name="hero"),
    path("hero/allocate/", HeroAllocateAPIView.as_view(), name="hero-allocate"),
    path("analytics/summary/", AnalyticsSummaryAPIView.as_view(), name="analytics-summary"),
    path("ai/chat/", AIChatAPIView.as_view(), name="ai-chat"),
    path("ai/act/", AIActAPIView.as_view(), name="ai-act"),
    path("ai/profile/", AIProfileAPIView.as_view(), name="ai-profile"),
    path("boss/", BossAPIView.as_view(), name="boss"),
    path("boss/attack/", BossAttackAPIView.as_view(), name="boss-attack"),
    path("boss/next/", BossNextAPIView.as_view(), name="boss-next"),
    path("system/", SystemAPIView.as_view(), name="system"),
    path("dashboard/", DashboardAPIView.as_view(), name="dashboard"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("", include(router.urls)),
]
