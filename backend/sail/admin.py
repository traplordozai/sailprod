"""
backend/sail/admin.py
----------------------------
Register models for the Django admin interface.
"""

from django.contrib import admin
from .models import (
    StudentProfile, Statement, StudentGrade,
    OrganizationProfile, FacultyProfile, MatchingRound
)

@admin.register(OrganizationProfile)
class OrganizationProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'get_areas_of_law', 'location', 'is_active')
    list_filter = ('is_active', 'areas_of_law')
    search_fields = ('name', 'location')

    def get_areas_of_law(self, obj):
        return ", ".join([area.name for area in obj.areas_of_law.all()])
    get_areas_of_law.short_description = 'Areas of Law'

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_id', 'first_name', 'last_name', 'is_matched')

@admin.register(Statement)
class StatementAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_profile', 'area_of_law', 'statement_grade')

@admin.register(StudentGrade)
class StudentGradeAdmin(admin.ModelAdmin):
    list_display = ('id', 'student_profile')

@admin.register(FacultyProfile)
class FacultyProfileAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'department', 'available_positions', 'filled_positions')

@admin.register(MatchingRound)
class MatchingRoundAdmin(admin.ModelAdmin):
    list_display = ('id', 'round_number', 'status', 'matched_count', 'total_students')