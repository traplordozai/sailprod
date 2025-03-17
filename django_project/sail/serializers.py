"""
django_project/sail/serializers.py
----------------------------------
DRF serializers for advanced usage.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    StudentProfile, Statement, StudentGrade,
    OrganizationProfile, FacultyProfile, MatchingRound
)

User = get_user_model()

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

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
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