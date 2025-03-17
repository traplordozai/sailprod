from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'grades', views.GradeViewSet, basename='grade')
router.register(r'statements', views.StatementViewSet, basename='statement')
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'matches', views.MatchViewSet, basename='match')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('students/import-csv/', views.ImportCSVView.as_view(), name='import-csv'),
    path('grades/import-pdf/', views.ImportPDFView.as_view(), name='import-pdf'),
    path('matching/run/', views.RunMatchingView.as_view(), name='run-matching'),
    path('matching/reset/', views.ResetMatchingView.as_view(), name='reset-matching'),
] 