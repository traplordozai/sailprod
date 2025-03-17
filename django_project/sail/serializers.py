"""
django_project/sail/serializers.py
----------------------------------
DRF serializers for advanced usage.
"""

from rest_framework import serializers
from .models import (
    StudentProfile, Statement, StudentGrade,
    OrganizationProfile, FacultyProfile, MatchingRound
)

class StatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statement
        fields = '__all__'

class StudentGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGrade
        fields = '__all__'

class StudentProfileSerializer(serializers.ModelSerializer):
    statements = StatementSerializer(many=True, read_only=True)
    grades = StudentGradeSerializer(read_only=True)

    class Meta:
        model = StudentProfile
        fields = '__all__'

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = '__all__'

class FacultyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyProfile
        fields = '__all__'

class MatchingRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingRound
        fields = '__all__'