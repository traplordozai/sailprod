"""
File: backend/sail/views.py
Purpose: View controllers for handling HTTP requests
Implements API endpoints and request handling logic
"""

import os
import uuid
import json
import logging
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.core.files.storage import default_storage
from django.utils import timezone
from celery.result import AsyncResult

from .models import (
    StudentProfile, MatchingRound, OrganizationProfile,
    FacultyProfile, Statement, StudentGrade, ImportLog,
    AreaOfLaw, StudentAreaRanking, SelfProposedExternship,
    SystemSetting
)
from .serializers import (
    StudentProfileSerializer, MatchingRoundSerializer,
    OrganizationProfileSerializer, FacultyProfileSerializer,
    StatementSerializer, StudentGradeSerializer,
    LoginSerializer, RegisterSerializer, ImportLogSerializer,
    SystemSettingSerializer
)
from .permissions import IsAdminOrReadOnly
from .services import import_students_from_csv, parse_grades_pdf, run_matching
from .tasks import process_csv_import_task, process_pdf_grades_task
from .services.dashboard import get_dashboard_stats, get_recent_activity

# Test connection endpoint
@api_view(['GET'])
@permission_classes([AllowAny])
def test_connection(request):
    """
    Simple endpoint to test API connectivity without authentication.
    Returns a success message, current server time, and API version.
    """
    return Response({
        'status': 'ok',
        'message': 'API connection successful!',
        'version': '1.0',
        'server_time': timezone.now().isoformat()
    }, status=200)

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

@api_view(['GET'])
def get_task_status(request, task_id):
    """
    Check the status of an async task
    """
    result = AsyncResult(task_id)
    
    response_data = {
        'task_id': task_id,
        'status': result.status,
    }
    
    if result.successful():
        response_data['result'] = result.get()
    elif result.failed():
        response_data['error'] = str(result.result)
        
    return Response(response_data)

class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related('grades').prefetch_related('statements')
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No CSV file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique filename to prevent collisions
        unique_filename = f"{uuid.uuid4()}_{csv_file.name}"
        temp_path = os.path.join(settings.MEDIA_ROOT, 'uploads', unique_filename)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        # Save file temporarily
        with open(temp_path, 'wb+') as destination:
            for chunk in csv_file.chunks():
                destination.write(chunk)
        
        # Run the task asynchronously
        user_id = request.user.id if request.user.is_authenticated else None
        task = process_csv_import_task.delay(temp_path, user_id)
        
        return Response({
            'task_id': task.id,
            'detail': 'CSV import started. Check task status for results.'
        }, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'])
    def upload_grades_pdf(self, request, pk=None):
        student = self.get_object()
        pdf_file = request.FILES.get('grades_pdf')
        if not pdf_file:
            return Response({'error': 'No PDF file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate unique filename to prevent collisions
        unique_filename = f"{uuid.uuid4()}_{pdf_file.name}"
        temp_path = os.path.join(settings.MEDIA_ROOT, 'uploads', unique_filename)
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        # Save file temporarily
        with open(temp_path, 'wb+') as destination:
            for chunk in pdf_file.chunks():
                destination.write(chunk)
        
        # Run the task asynchronously
        user_id = request.user.id if request.user.is_authenticated else None
        task = process_pdf_grades_task.delay(temp_path, student.student_id, user_id)
        
        return Response({
            'task_id': task.id,
            'detail': 'PDF processing started. Check task status for results.'
        }, status=status.HTTP_202_ACCEPTED)


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
    
    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        """
        Import organizations from CSV
        """
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response({'error': 'No CSV file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Handle this directly for now - could be moved to a Celery task later
        # (simplified for brevity)
        return Response({'detail': 'Organizations CSV import is not yet implemented'}, 
                        status=status.HTTP_501_NOT_IMPLEMENTED)

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

class ImportLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for importing logs - readonly to prevent manual editing
    """
    queryset = ImportLog.objects.all().order_by('-import_datetime')
    serializer_class = ImportLogSerializer
    permission_classes = [IsAdminOrReadOnly]

class SystemSettingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing system settings.
    Regular users can only view public settings.
    Admin users can view all settings and modify them.
    """
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    def get_queryset(self):
        """Filter settings based on user permissions"""
        if self.request.user.is_staff:
            return SystemSetting.objects.all()
        # Non-admin users can only see public settings
        return SystemSetting.objects.filter(is_public=True)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get settings grouped by category"""
        # Get filtered queryset based on permissions
        queryset = self.get_queryset()
        
        # Group settings by category
        categories = {}
        for setting in queryset:
            if setting.category not in categories:
                categories[setting.category] = []
            
            serializer = self.get_serializer(setting)
            categories[setting.category].append(serializer.data)
        
        return Response(categories)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Update multiple settings at once"""
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settings_data = request.data
        updated = []
        errors = []
        
        for item in settings_data:
            try:
                key = item.get('key')
                if not key:
                    errors.append({"error": "Setting key is required", "data": item})
                    continue
                
                setting = SystemSetting.objects.filter(key=key).first()
                if not setting:
                    errors.append({"error": f"Setting with key '{key}' not found", "data": item})
                    continue
                
                # Update the setting
                setting.value = item.get('value', setting.value)
                setting.save()
                
                # Add to updated list
                serializer = self.get_serializer(setting)
                updated.append(serializer.data)
                
            except Exception as e:
                errors.append({"error": str(e), "data": item})
        
        return Response({
            "updated": updated,
            "errors": errors
        })
    
    @action(detail=False, methods=['get'])
    def defaults(self, request):
        """Initialize default settings if they don't exist yet"""
        if not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Define default settings
        default_settings = [
            # General settings
            {"key": "site_name", "value": "SAIL - Student Articling Information and Logistics", 
             "data_type": "string", "category": "general", 
             "description": "The name of your system that appears in the browser tab and emails"},
            {"key": "admin_email", "value": "admin@uwo.ca", 
             "data_type": "string", "category": "general", 
             "description": "Primary contact email for system administrators"},
            {"key": "timezone", "value": "America/Toronto", 
             "data_type": "string", "category": "general", 
             "description": "Default timezone for the system", "is_public": True},
             
            # Student settings
            {"key": "max_statements", "value": "3", 
             "data_type": "integer", "category": "students", 
             "description": "Maximum number of statements a student can submit"},
            {"key": "statement_deadline", "value": "2024-04-15", 
             "data_type": "date", "category": "students", 
             "description": "Deadline for student statement submissions", "is_public": True},
            {"key": "min_gpa", "value": "2.7", 
             "data_type": "float", "category": "students", 
             "description": "Minimum GPA required for participation"},
             
            # Organization settings
            {"key": "max_positions", "value": "5", 
             "data_type": "integer", "category": "organizations", 
             "description": "Maximum number of positions an organization can post"},
            {"key": "position_deadline", "value": "2024-04-30", 
             "data_type": "date", "category": "organizations", 
             "description": "Deadline for organization position submissions", "is_public": True},
            {"key": "require_verification", "value": "true", 
             "data_type": "boolean", "category": "organizations", 
             "description": "Require organization verification before posting positions"},
             
            # Matching settings
            {"key": "algorithm_version", "value": "v2", 
             "data_type": "string", "category": "matching", 
             "description": "Version of the matching algorithm to use"},
            {"key": "weight_gpa", "value": "0.3", 
             "data_type": "float", "category": "matching", 
             "description": "Weight of GPA in matching score (0-1)"},
            {"key": "weight_statement", "value": "0.4", 
             "data_type": "float", "category": "matching", 
             "description": "Weight of statement grade in matching score (0-1)"},
            {"key": "weight_preferences", "value": "0.3", 
             "data_type": "float", "category": "matching", 
             "description": "Weight of preferences in matching score (0-1)"},
             
            # Notification settings
            {"key": "email_notifications", "value": "true", 
             "data_type": "boolean", "category": "notifications", 
             "description": "Enable email notifications for system events"},
            {"key": "notify_new_submissions", "value": "true", 
             "data_type": "boolean", "category": "notifications", 
             "description": "Notify admins of new statement submissions"},
            {"key": "notify_matching_complete", "value": "true", 
             "data_type": "boolean", "category": "notifications", 
             "description": "Notify when matching process is complete"},
             
            # Security settings
            {"key": "require_2fa", "value": "true", 
             "data_type": "boolean", "category": "security", 
             "description": "Require two-factor authentication for admin accounts"},
            {"key": "session_timeout", "value": "30", 
             "data_type": "integer", "category": "security", 
             "description": "Session timeout in minutes"},
            {"key": "max_login_attempts", "value": "5", 
             "data_type": "integer", "category": "security", 
             "description": "Maximum number of failed login attempts before lockout"},
             
            # Import/Export settings
            {"key": "allowed_file_types", "value": "csv,pdf,xlsx", 
             "data_type": "string", "category": "import_export", 
             "description": "Comma-separated list of allowed file types for import"},
            {"key": "max_file_size", "value": "10", 
             "data_type": "integer", "category": "import_export", 
             "description": "Maximum file size for uploads in MB"},
            {"key": "auto_backup", "value": "true", 
             "data_type": "boolean", "category": "import_export", 
             "description": "Automatically backup the database before imports"},
             
            # Appearance settings
            {"key": "primary_color", "value": "#4F2683", 
             "data_type": "string", "category": "appearance", 
             "description": "Primary color for the UI (Western purple)", "is_public": True},
            {"key": "secondary_color", "value": "#EFBE7D", 
             "data_type": "string", "category": "appearance", 
             "description": "Secondary color for the UI", "is_public": True},
            {"key": "display_logo", "value": "true", 
             "data_type": "boolean", "category": "appearance", 
             "description": "Display the Western logo in the header", "is_public": True},
        ]
        
        # Create settings if they don't exist
        created = []
        for setting_data in default_settings:
            setting, created_flag = SystemSetting.objects.get_or_create(
                key=setting_data['key'],
                defaults=setting_data
            )
            if created_flag:
                created.append(setting.key)
        
        return Response({
            "message": f"Created {len(created)} default settings",
            "created": created
        })

@api_view(['GET'])
@permission_classes([AllowAny])
def test_dashboard(request):
    """
    Test endpoint that returns dashboard data with HTML formatting
    """
    # Get dashboard data
    stats = get_dashboard_stats()
    
    # Format as simple HTML for viewing
    html = f"""
    <html>
    <head>
        <title>Dashboard Stats</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 20px; }}
            h1 {{ color: #4F2683; }}
            .stats {{ display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }}
            .stat-card {{ background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); min-width: 200px; }}
            .stat-title {{ font-size: 14px; color: #666; margin-bottom: 5px; }}
            .stat-value {{ font-size: 24px; font-weight: bold; }}
            pre {{ background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <h1>Dashboard Stats (Debug View)</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-title">Total Students</div>
                <div class="stat-value">{stats['total_students']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Matched Students</div>
                <div class="stat-value">{stats['matched_students']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Pending Matches</div>
                <div class="stat-value">{stats['pending_matches']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Needing Approval</div>
                <div class="stat-value">{stats['approval_needed']}</div>
            </div>
        </div>
        
        <h2>Raw Data</h2>
        <pre>{str(stats)}</pre>
    </body>
    </html>
    """
    
    return Response(html, content_type='text/html')

@api_view(['GET'])
@permission_classes([AllowAny])
def dashboard_stats(request):
    """
    Get real-time statistics for the admin dashboard
    """
    # Get full stats
    stats = get_dashboard_stats()
    
    # Always provide basic stats for now to simplify frontend development
    public_stats = {
        'total_students': stats['total_students'],
        'matched_students': stats['matched_students'],
        'pending_matches': stats['pending_matches'],
        'approval_needed': stats['approval_needed'],
        'match_status_chart': stats['match_status_chart'],
        'area_law_chart': stats['area_law_chart'],
    }
    return Response(public_stats)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_activity(request):
    """
    Get recent activity for the admin dashboard
    """
    if not request.user.is_staff:
        return Response(
            {"detail": "You do not have permission to access dashboard activity."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get the limit parameter (default to 5)
    limit = int(request.query_params.get('limit', 5))
    # Restrict limit to reasonable range
    limit = max(1, min(limit, 20))
    
    activities = get_recent_activity(limit=limit)
    return Response(activities)

# This is a completely new public endpoint with no auth
@api_view(['GET'])
@permission_classes([AllowAny])  # Explicitly mark as publicly accessible
def public_dashboard_stats(request):
    """
    Get public dashboard stats with no authentication
    """
    # Create some sample data
    sample_stats = {
        'total_students': 25,
        'matched_students': 18,
        'pending_matches': 7,
        'approval_needed': 3,
        'match_status_chart': [
            {'status': 'Pending', 'count': 7},
            {'status': 'Matched', 'count': 18},
            {'status': 'Declined', 'count': 2},
            {'status': 'Approved', 'count': 16}
        ],
        'area_law_chart': [
            {'area': 'Corporate', 'count': 8},
            {'area': 'Criminal', 'count': 6},
            {'area': 'Family', 'count': 5},
            {'area': 'IP', 'count': 4},
            {'area': 'Real Estate', 'count': 2}
        ]
    }
    return Response(sample_stats)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import (
    StudentProfile, Statement, StudentGrade, 
    StudentAreaRanking, SelfProposedExternship
)
from .serializers import (
    StudentProfileSerializer, StudentGradeSerializer,
    StudentAreaRankingSerializer, SelfProposedExternshipSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_profile_detail(request, student_id):
    """
    Get detailed student profile including grades, area rankings, and externship information
    """
    student = get_object_or_404(StudentProfile, id=student_id)
    
    try:
        grades = StudentGrade.objects.get(student_profile=student)
    except StudentGrade.DoesNotExist:
        grades = None
        
    area_rankings = StudentAreaRanking.objects.filter(student_profile=student)
    
    try:
        self_proposed = SelfProposedExternship.objects.get(student_profile=student)
    except SelfProposedExternship.DoesNotExist:
        self_proposed = None

    return Response({
        'student': StudentProfileSerializer(student).data,
        'grades': StudentGradeSerializer(grades).data if grades else None,
        'area_rankings': StudentAreaRankingSerializer(area_rankings, many=True).data,
        'self_proposed_externship': SelfProposedExternshipSerializer(self_proposed).data if self_proposed else None,
    })
