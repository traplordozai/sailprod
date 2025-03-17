"""
django_project/sail/admin.py
----------------------------
Register models for the Django admin interface.
"""

from django.contrib import admin
from .models import (
    StudentProfile, Statement, StudentGrade,
    OrganizationProfile, FacultyProfile, MatchingRound
)

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_id', 'first_name', 'last_name', 'is_matched')

@admin.register(Statement)
class StatementAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_profile', 'area_of_law', 'statement_grade')

@admin.register(StudentGrade)
class StudentGradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_profile')

@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'area_of_law', 'available_positions', 'filled_positions')

@admin.register(FacultyProfile)
class FacultyProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'department', 'available_positions', 'filled_positions')

@admin.register(MatchingRound)
class MatchingRoundAdmin(admin.ModelAdmin):
    list_display = ('id', 'round_number', 'status', 'matched_count', 'total_students')