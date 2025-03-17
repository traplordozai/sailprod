from rest_framework import serializers
from .models import Student, Grade, Statement, Organization, Match

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.__str__', read_only=True)
    
    class Meta:
        model = Grade
        fields = '__all__'
        read_only_fields = ('uploaded_at',)

class StatementSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.__str__', read_only=True)
    graded_by_name = serializers.CharField(source='graded_by.get_full_name', read_only=True)
    
    class Meta:
        model = Statement
        fields = '__all__'
        read_only_fields = ('created_at',)

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class MatchSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.__str__', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'approved_at')

class DashboardStatsSerializer(serializers.Serializer):
    total_students = serializers.IntegerField()
    matched_students = serializers.IntegerField()
    pending_matches = serializers.IntegerField()
    needs_approval = serializers.IntegerField()
    total_organizations = serializers.IntegerField()
    available_positions = serializers.IntegerField()
    ungraded_statements = serializers.IntegerField()
    matches_by_status = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        )
    )
    matches_by_area = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        )
    ) 