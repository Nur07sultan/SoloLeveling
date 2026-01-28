from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
	"""Single-tenant user: all domain data is scoped to a single owner."""

	email = models.EmailField(unique=True)
	avatar = models.ImageField(upload_to="avatars/%Y/%m/", blank=True, null=True)
	title = models.CharField(max_length=64, blank=True, default="")
	bio = models.TextField(blank=True, default="")

	def __str__(self) -> str:  # pragma: no cover
		return self.username
