"""
django_project/urls.py
----------------------
Root URL config that wires up:
1. Django's built-in admin at /admin/
2. Your app-level routes via /api/
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Django admin site
    path('admin/', admin.site.urls),

    # API routes for your "sail" app
    path('api/', include('django_project.sail.urls')),
]