"""
backend/sail/serializers.py
----------------------------------
DRF serializers for advanced usage.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    StudentProfile, MatchingRound, OrganizationProfile,
    FacultyProfile, Statement, StudentGrade, ImportLog,
    AreaOfLaw, StudentAreaRanking, SelfProposedExternship,
    SystemSetting
)

User = get_user_model()

# Add new serializers for the enhanced models

class SystemSettingSerializer(serializers.ModelSerializer):
    typed_value = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemSetting
        fields = (
            'id', 'key', 'value', 'typed_value', 'data_type', 'category', 
            'description', 'is_public', 'requires_restart', 
            'created_at', 'updated_at'
        )
    
    def get_typed_value(self, obj):
        return obj.get_typed_value()

class AreaOfLawSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaOfLaw
        fields = ('id', 'name')

class StudentAreaRankingSerializer(serializers.ModelSerializer):
    area_name = serializers.CharField(source='area.name', read_only=True)
    
    class Meta:
        model = StudentAreaRanking
        fields = ('id', 'area', 'area_name', 'rank')

class ImportLogSerializer(serializers.ModelSerializer):
    import_datetime_formatted = serializers.SerializerMethodField()
    errors_list = serializers.SerializerMethodField()
    
    class Meta:
        model = ImportLog
        fields = (
            'id', 'file_name', 'import_datetime', 'import_datetime_formatted',
            'import_type', 'imported_by', 'success_count', 'error_count',
            'errors', 'errors_list'
        )
    
    def get_import_datetime_formatted(self, obj):
        return obj.import_datetime.strftime('%Y-%m-%d %H:%M:%S')
    
    def get_errors_list(self, obj):
        """Convert the JSON errors string to a list if present"""
        if not obj.errors:
            return []
        
        try:
            import json
            return json.loads(obj.errors)
        except (json.JSONDecodeError, TypeError):
            return [obj.errors]  # Return as a single-item list if not valid JSON

class SelfProposedExternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = SelfProposedExternship
        fields = (
            'id', 'student_profile', 'organization', 'supervisor',
            'supervisor_email', 'address', 'website'
        )

class StatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Statement
        fields = ('id', 'student_profile', 'content', 'area_of_law', 'statement_grade')

class StudentGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGrade
        fields = (
            'id', 'student_profile', 
            'constitutional_law', 'contracts', 'criminal_law', 'property_law', 'torts',
            'lrw_case_brief', 'lrw_multiple_case', 'lrw_short_memo'
        )

# Use existing serializers (with possible updates)

class StudentProfileSerializer(serializers.ModelSerializer):
    statements = serializers.SerializerMethodField()
    grades = serializers.SerializerMethodField()
    area_rankings = StudentAreaRankingSerializer(many=True, read_only=True)
    self_proposed_externship = serializers.SerializerMethodField()
    
    class Meta:
        model = StudentProfile
        fields = (
            'id', 'student_id', 'first_name', 'last_name', 'email', 'backup_email',
            'program', 'program_chosen', 'areas_of_law', 
            'statements_of_interest', 'location_preferences', 'work_preferences',
            'is_matched', 'admin_approval_needed', 'is_active',
            'statements', 'grades', 'area_rankings', 'self_proposed_externship',
            'created_at', 'updated_at'
        )
    
    def get_statements(self, obj):
        statements = Statement.objects.filter(student_profile=obj)
        return StatementSerializer(statements, many=True).data
    
    def get_grades(self, obj):
        try:
            return StudentGradeSerializer(obj.grades).data
        except StudentGrade.DoesNotExist:
            return None
    
    def get_self_proposed_externship(self, obj):
        try:
            return SelfProposedExternshipSerializer(obj.self_proposed).data
        except (SelfProposedExternship.DoesNotExist, AttributeError):
            return None

class OrganizationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrganizationProfile
        fields = (
            'id', 'name', 'area_of_law', 'location',
            'available_positions', 'filled_positions',
            'created_at', 'updated_at'
        )

class FacultyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyProfile
        fields = (
            'id', 'full_name', 'department', 'research_areas',
            'available_positions', 'filled_positions',
            'created_at', 'updated_at'
        )

class MatchingRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = MatchingRound
        fields = ('id', 'round_number', 'status', 'matched_count', 'total_students')

# Authentication serializers

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    role = serializers.ChoiceField(choices=['Student', 'Faculty', 'Organization'])
    org_name = serializers.CharField(required=False)

    def validate_email(self, value):
        role = self.initial_data.get('role')
        if role in ['Student', 'Faculty'] and not value.endswith('@uwo.ca'):
            raise serializers.ValidationError('Students and Faculty must use a @uwo.ca email address')
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists')
        return value

    def validate(self, data):
        if data['role'] == 'Organization' and not data.get('org_name'):
            raise serializers.ValidationError({'org_name': 'Organization name is required'})
        return data

    def create(self, validated_data):
        role = validated_data.pop('role')
        org_name = validated_data.pop('org_name', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )

        # Create role-specific profile
        if role == 'Student':
            StudentProfile.objects.create(
                student_id=user.id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email
            )
        elif role == 'Faculty':
            FacultyProfile.objects.create(
                full_name=f"{user.first_name} {user.last_name}"
            )
        elif role == 'Organization':
            OrganizationProfile.objects.create(
                name=org_name
            )

        return user