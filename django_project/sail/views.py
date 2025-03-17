"""
django_project/sail/views.py
----------------------------
Advanced DRF ViewSets for CRUD, plus custom actions for CSV import, PDF upload, matching.
"""

import os
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.files.storage import default_storage

from .models import (
    StudentProfile, MatchingRound, OrganizationProfile,
    FacultyProfile, Statement, StudentGrade
)
from .serializers import (
    StudentProfileSerializer, MatchingRoundSerializer,
    OrganizationProfileSerializer, FacultyProfileSerializer,
    StatementSerializer, StudentGradeSerializer,
    LoginSerializer, RegisterSerializer
)
from .permissions import IsAdminOrReadOnly
from .services import import_students_from_csv, parse_grades_pdf, run_matching

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        user = authenticate(email=email, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            
            # Determine user role
            role = None
            if hasattr(user, 'studentprofile'):
                role = 'Student'
            elif hasattr(user, 'facultyprofile'):
                role = 'Faculty'
            elif hasattr(user, 'organizationprofile'):
                role = 'Organization'
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': role
                }
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': serializer.validated_data['role']
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related('grades').prefetch_related('statements')
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No CSV file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # store temporarily
        temp_path = os.path.join(settings.BASE_DIR, 'tmp.csv')
        with open(temp_path, 'wb+') as destination:
            for chunk in csv_file.chunks():
                destination.write(chunk)

        import_students_from_csv(temp_path)
        os.remove(temp_path)
        return Response({'detail': 'CSV imported successfully'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def upload_grades_pdf(self, request, pk=None):
        student = self.get_object()
        pdf_file = request.FILES.get('grades_pdf')
        if not pdf_file:
            return Response({'error': 'No PDF file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        temp_path = os.path.join(settings.BASE_DIR, pdf_file.name)
        with open(temp_path, 'wb+') as destination:
            for chunk in pdf_file.chunks():
                destination.write(chunk)

        parse_grades_pdf(temp_path)
        os.remove(temp_path)
        return Response({'detail': 'PDF parsed & grades updated'}, status=status.HTTP_200_OK)


class MatchingRoundViewSet(viewsets.ModelViewSet):
    queryset = MatchingRound.objects.all()
    serializer_class = MatchingRoundSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['post'])
    def run_algorithm(self, request, pk=None):
        instance = self.get_object()
        run_matching(instance.round_number)
        instance.refresh_from_db()
        return Response({
            'detail': f"Matching round {instance.round_number} completed",
            'matched_count': instance.matched_count,
            'total_students': instance.total_students
        }, status=status.HTTP_200_OK)

class OrganizationProfileViewSet(viewsets.ModelViewSet):
    queryset = OrganizationProfile.objects.all()
    serializer_class = OrganizationProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

class FacultyProfileViewSet(viewsets.ModelViewSet):
    queryset = FacultyProfile.objects.all()
    serializer_class = FacultyProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

class StatementViewSet(viewsets.ModelViewSet):
    queryset = Statement.objects.select_related('student_profile')
    serializer_class = StatementSerializer
    permission_classes = [IsAdminOrReadOnly]

class StudentGradeViewSet(viewsets.ModelViewSet):
    queryset = StudentGrade.objects.select_related('student_profile')
    serializer_class = StudentGradeSerializer
    permission_classes = [IsAdminOrReadOnly]