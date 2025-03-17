"""
backend/urls.py
----------------------
Root URL config that wires up:
1. Django's built-in admin at /admin/
2. Your app-level routes via /api/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


urlpatterns = [
    # Django admin site
    path('admin/', admin.site.urls),

    # API routes for your "sail" app
    path('api/', include('backend.sail.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

]