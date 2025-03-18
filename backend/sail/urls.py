"""
backend/sail/urls.py
---------------------------
App-level routes using DRF's DefaultRouter.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Import classes with their original names
router = DefaultRouter()
router.register(r'students', views.StudentProfileViewSet)
router.register(r'organizations', views.OrganizationProfileViewSet)
router.register(r'faculty', views.FacultyProfileViewSet)
router.register(r'statements', views.StatementViewSet)
router.register(r'grades', views.StudentGradeViewSet)
router.register(r'matching-rounds', views.MatchingRoundViewSet)
router.register(r'import-logs', views.ImportLogViewSet)
router.register(r'settings', views.SystemSettingViewSet)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='auth_login'),
    path('auth/register/', views.register_view, name='auth_register'),
    
    # Test connection endpoint (publicly accessible)
    path('test-connection/', views.test_connection, name='test-connection'),
    
    # Debug endpoint - no authentication required
    path('test-dashboard/', views.test_dashboard, name='test-dashboard'),
    
    # Task status endpoint
    path('tasks/<str:task_id>/', views.get_task_status, name='task-status'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views.dashboard_stats, name='dashboard-stats'),
    path('dashboard/activity/', views.dashboard_activity, name='dashboard-activity'),
    
    # API endpoints
    path('', include(router.urls)),
]