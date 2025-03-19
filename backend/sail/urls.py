# backend/sail/urls.py (consolidated)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from backend.admin_portal import views as admin_views
from . import views

# Main API router
router = DefaultRouter()
router.register(r'students', views.StudentProfileViewSet)
router.register(r'organizations', views.OrganizationProfileViewSet)
router.register(r'faculty', views.FacultyProfileViewSet)
router.register(r'statements', views.StatementViewSet)
router.register(r'grades', views.StudentGradeViewSet)
router.register(r'matching-rounds', views.MatchingRoundViewSet)
router.register(r'import-logs', views.ImportLogViewSet)
router.register(r'settings', views.SystemSettingViewSet)
router.register(r'matches', admin_views.MatchViewSet, basename='match')

# Admin portal specific endpoints
admin_router = DefaultRouter()
admin_router.register(r'students', admin_views.StudentViewSet, basename='admin-student')
admin_router.register(r'grades', admin_views.GradeViewSet, basename='admin-grade')
admin_router.register(r'statements', admin_views.StatementViewSet, basename='admin-statement')
admin_router.register(r'organizations', admin_views.OrganizationViewSet, basename='admin-organization')

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', views.login_view, name='auth_login'),
    path('auth/register/', views.register_view, name='auth_register'),

    # Test/debug endpoints
    path('test-connection/', views.test_connection, name='test-connection'),
    path('test-dashboard/', views.test_dashboard, name='test-dashboard'),

    # Dashboard endpoints
    path('dashboard/stats/', views.public_dashboard_stats, name='public-dashboard-stats'),
    path('dashboard/activity/', views.dashboard_activity, name='dashboard-activity'),

    # Task status endpoint
    path('tasks/<str:task_id>/', views.get_task_status, name='task-status'),

    # Admin portal specific paths
    path('admin/', include(admin_router.urls)),
    path('admin/dashboard/', admin_views.DashboardStatisticsView.as_view(), name='dashboard_statistics'),
    path('admin/import/csv/', admin_views.ImportCSVView.as_view(), name='import-csv'),
    path('admin/import/pdf/', admin_views.ImportPDFView.as_view(), name='import-pdf'),
    path('admin/matching/run/', admin_views.RunMatchingView.as_view(), name='run-matching'),
    path('admin/matching/reset/', admin_views.ResetMatchingView.as_view(), name='reset-matching'),

    # Main API router
    path('', include(router.urls)),

    # Student profile detail endpoint
    path('students/<str:student_id>/profile/', views.student_profile_detail, name='student_profile_detail'),
]
