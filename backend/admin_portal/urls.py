from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'grades', views.GradeViewSet, basename='grade')
router.register(r'statements', views.StatementViewSet, basename='statement')
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'matches', views.MatchViewSet, basename='match')

# Auth URLs for login, register, etc.
auth_patterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('register/', views.RegisterView.as_view(), name='register'),
]

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('dashboard/', views.dashboard_statistics, name='dashboard_statistics'),
    path('import/csv/', views.ImportCSVView.as_view(), name='import-csv'),
    path('import/pdf/', views.ImportPDFView.as_view(), name='import-pdf'),
    path('matching/run/', views.RunMatchingView.as_view(), name='run-matching'),
    path('matching/reset/', views.ResetMatchingView.as_view(), name='reset-matching'),
    path('students/<int:student_id>/', views.StudentProfileView.as_view(), name='student-profile'),
]