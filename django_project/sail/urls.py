"""
django_project/sail/urls.py
---------------------------
App-level routes using DRF's DefaultRouter.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentProfileViewSet)
router.register(r'organizations', views.OrganizationProfileViewSet)
router.register(r'faculty', views.FacultyProfileViewSet)
router.register(r'statements', views.StatementViewSet)
router.register(r'grades', views.StudentGradeViewSet)
router.register(r'matching', views.MatchingRoundViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='auth_login'),
    path('auth/register/', views.register_view, name='auth_register'),
    
    # API endpoints
    path('', include(router.urls)),
]