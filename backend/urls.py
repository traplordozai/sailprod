"""
File: backend/urls.py
Purpose: Main URL configuration for the Django project
Defines root URL patterns and includes app-specific URL configurations
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


# Create a custom AdminSite class that just changes the site_url
admin.site.site_url = settings.FRONTEND_ADMIN_URL


urlpatterns = [
    # Django admin site
    path('admin/', admin.site.urls),

    # API routes for your "sail" app
    path('api/', include('backend.sail.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),

    # Redirect root URL to Django admin
    path('', RedirectView.as_view(url='/admin/'), name='home'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
