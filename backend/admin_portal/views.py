import PyPDF2
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from io import BytesIO
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q, Sum
from django.utils import timezone
from .models import Student, Grade, Statement, Organization, Match
from .serializers import (
    StudentSerializer, GradeSerializer, StatementSerializer,
    OrganizationSerializer, MatchSerializer, DashboardStatsSerializer
)
from .utils import process_csv_file, process_pdf_file
import pandas as pd
import csv
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

class BaseAPIView(APIView):
    def get_error_response(self, message, status_code=400):
        return Response({'error': str(message)}, status=status_code)

    def get_success_response(self, message, data=None, status_code=200):
        response = {'message': message}
        if data:
            response.update(data)
        return Response(response, status=status_code)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()  # Fixed typo
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['program', 'is_active', 'areas_of_interest']
    search_fields = ['last_name', 'given_names', 'email', 'student_id']
    
    def get_unmatched_students(self):
        return self.get_queryset().exclude(matches__status='APPROVED')


    @action(detail=False, methods=['get'])
    def unmatched(self, request):
        queryset = self.get_unmatched_students()
        serializer = self.get_serializer(queryset, many=True)
        return self.get_success_response('Retrieved unmatched students', {'data': serializer.data})
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get students with pending matches"""
        queryset = self.get_queryset().filter(matches__status='PENDING').distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()  # Fixed typo
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['student__last_name', 'student__given_names', 'student__student_id']

class StatementViewSet(viewsets.ModelViewSet):
    queryset = Statement.objects.all()  # Fixed typo
    serializer_class = StatementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['area_of_law', 'graded_by']
    search_fields = ['student__last_name', 'student__given_names', 'content']
    
    @action(detail=False, methods=['get'])
    def ungraded(self, request):
        """Get statements that haven't been graded yet"""
        queryset = self.get_queryset().filter(grade__isnull=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()  # Fixed typo
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_active', 'areas_of_law']
    search_fields = ['name', 'description', 'location']
    
    @action(detail=False, methods=['get'])
    def available_positions(self, request):
        """Get organizations with available positions"""
        queryset = self.get_queryset().filter(available_positions__gt=0)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()  # Fixed typo
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'area_of_law', 'approved_by']
    search_fields = ['student__last_name', 'organization__name', 'notes']
    
    def perform_match_action(self, match, action):
        if action == 'approve':
            match.approve(self.request.user)
        elif action == 'reject':
            match.reject()
        return self.get_serializer(match).data

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        match = self.get_object()
        data = self.perform_match_action(match, 'approve')
        return self.get_success_response('Match approved', data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        match = self.get_object()
        data = self.perform_match_action(match, 'reject')
        return self.get_success_response('Match rejected', data)

class DashboardStatsView(BaseAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_student_stats(self):
        return {
            'total_students': Student.objects.count(),
            'matched_students': Student.objects.filter(is_matched=True).count(),
            'pending_matches': Student.objects.filter(is_matched=False).count(),
            'needs_approval': Student.objects.filter(needs_approval=True).count(),
        }

    def get_match_stats(self):
        return {
            'matches_by_status': list(Match.objects.values('status').annotate(count=Count('id'))),
            'matches_by_area': list(Match.objects.values('area_of_law').annotate(count=Count('id')))
        }

    def get(self, request):
        stats = {
            **self.get_student_stats(),
            **self.get_match_stats(),
            'total_organizations': Organization.objects.count(),
            'available_positions': Organization.objects.aggregate(total=Sum('available_positions'))['total'],
            'ungraded_statements': Statement.objects.filter(grade__isnull=True).count(),
        }
        return self.get_success_response('Dashboard stats retrieved', stats)

class DashboardStatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_students = Student.objects.count()
        matched_students = Student.objects.filter(is_matched=True).count()
        pending_matches = Student.objects.filter(is_matched=False).count()
        needs_approval = Student.objects.filter(needs_approval=True).count()

        return Response({
            'total_students': total_students,
            'matched_students': matched_students,
            'pending_matches': pending_matches,
            'needs_approval': needs_approval,
        })

class ImportCSVView(BaseAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def validate_csv_columns(self, df):
        required_columns = ['given_names', 'last_name', 'email', 'student_id', 'program']
        return all(col in df.columns for col in required_columns)

    def process_student_row(self, row):
        return Student.objects.update_or_create(
            student_id=row['student_id'],
            defaults={
                'given_names': row['given_names'],
                'last_name': row['last_name'],
                'email': row['email'],
                'program': row['program'],
                'areas_of_interest': row.get('areas_of_interest', []),
                'location_preferences': row.get('location_preferences', []),
                'work_preferences': row.get('work_preferences', []),
            }
        )

    def post(self, request, *args, **kwargs):
        if 'csv_file' not in request.FILES:
            return self.get_error_response('No file uploaded')

        csv_file = request.FILES['csv_file']
        try:
            df = pd.read_csv(csv_file)
            if not self.validate_csv_columns(df):
                return self.get_error_response('Missing required columns')

            created_count = 0
            for _, row in df.iterrows():
                self.process_student_row(row)
                created_count += 1

            return self.get_success_response(f'Successfully imported {created_count} students')
        except Exception as e:
            return self.get_error_response(str(e))

class ImportPDFView(BaseAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def validate_pdf_file(self, pdf_file):
        if not pdf_file:
            raise ValueError('No PDF file provided')
        if not pdf_file.name.lower().endswith('.pdf'):
            raise ValueError('File must be a PDF')

    def post(self, request):
        try:
            pdf_file = request.FILES.get('pdf_file')
            self.validate_pdf_file(pdf_file)
            process_pdf_file(pdf_file)
            return self.get_success_response('Successfully imported grades from PDF')
        except Exception as e:
            return self.get_error_response(str(e))

class RunMatchingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # TODO: Implement matching algorithm
            return Response({'message': 'Successfully ran matching algorithm'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ResetMatchingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            Match.objects.all().delete()
            return Response({'message': 'Successfully reset all matches'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            ) 

class ImportCSVViewNew(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=400)

        file = request.FILES['file']
        try:
            decoded_file = file.read().decode('utf-8').splitlines()
            reader = csv.DictReader(decoded_file)
            
            for row in reader:
                Student.objects.create(
                    given_names=row['Given names'],
                    last_name=row['Last name'],
                    email=row['Student Email'],
                    student_id=row['Student ID'],
                    program=row['Programs chosen'],
                    areas_of_law=row['Areas of law selected'],
                    ranking=row['Ranking'],
                    statement_of_interest=row['Statement of interest'],
                    self_proposed_externship=row['Self-proposed externship'],
                    location_preference=row['Location Preference'],
                    work_preference=row['Work Preference'],
                )
            
            return Response({'message': 'CSV data imported successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class StudentProfileView(APIView):
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            serializer = StudentSerializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            serializer = StudentSerializer(student, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

class LoginView(APIView):
    """
    Authenticate user and return tokens
    """
    permission_classes = []  # Allow unauthenticated access

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = None
        
        # Try to find the user by email
        try:
            username = User.objects.get(email=email).username
            user = authenticate(username=username, password=password)
        except User.DoesNotExist:
            # If user doesn't exist by email, try username directly
            user = authenticate(username=email, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': 'Admin',  # Default role for simplicity
                }
            })
        
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


class RegisterView(APIView):
    """
    Register a new user and return tokens
    """
    permission_classes = []  # Allow unauthenticated access

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        role = request.data.get('role', 'Admin')
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the user
        try:
            user = User.objects.create_user(
                username=email,  # Use email as username
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                    'role': role
                }
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def get_permissions(self):
        """
        Override to ensure proper permission checking
        """
        return [permission() for permission in self.permission_classes]