"""
django_project/sail/urls.py
---------------------------
App-level routes using DRF's DefaultRouter.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from django_project.sail.views import (
    StudentProfileViewSet, MatchingRoundViewSet,
    OrganizationProfileViewSet, FacultyProfileViewSet,
    StatementViewSet, StudentGradeViewSet
)

router = DefaultRouter()
router.register(r'students', StudentProfileViewSet, basename='student')
router.register(r'matching-rounds', MatchingRoundViewSet, basename='matching-rounds')
router.register(r'organizations', OrganizationProfileViewSet, basename='organizations')
router.register(r'faculty', FacultyProfileViewSet, basename='faculty')
router.register(r'statements', StatementViewSet, basename='statements')
router.register(r'grades', StudentGradeViewSet, basename='grades')

urlpatterns = [
    # Instead of including ourselves, just include the router
    path('', include(router.urls)),
]