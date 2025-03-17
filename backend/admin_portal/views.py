import PyPDF2
from rest_framework import viewsets, status, permissions
from io import BytesIO
from rest_framework import status
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
from backend.sail.models import Student
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['program', 'is_active', 'areas_of_interest']
    search_fields = ['last_name', 'given_names', 'email', 'student_id']
    
    @action(detail=False, methods=['get'])
    def unmatched(self, request):
        """Get students who haven't been matched yet"""
        queryset = self.get_queryset().exclude(matches__status='APPROVED')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approval(self, request):
        """Get students with pending matches"""
        queryset = self.get_queryset().filter(matches__status='PENDING').distinct()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['student__last_name', 'student__given_names', 'student__student_id']

class StatementViewSet(viewsets.ModelViewSet):
    queryset = Statement.objects.all()
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
    queryset = Organization.objects.all()
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
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'area_of_law', 'approved_by']
    search_fields = ['student__last_name', 'organization__name', 'notes']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        match = self.get_object()
        match.approve(request.user)
        serializer = self.get_serializer(match)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        match = self.get_object()
        match.reject()
        serializer = self.get_serializer(match)
        return Response(serializer.data)

class DashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_students = Student.objects.count()
        matched_students = Student.objects.filter(is_matched=True).count()
        pending_matches = Match.objects.filter(status='PENDING').count()
        needs_approval = Match.objects.filter(status='NEEDS_APPROVAL').count()
        total_orgs = Organization.objects.count()
        available_positions = Organization.objects.aggregate(total=Sum('available_positions'))['total']
        ungraded_statements = Statement.objects.filter(statement_grade__isnull=True).count()

        matches_by_status = Match.objects.values('status').annotate(count=Count('id'))
        matches_by_area = Match.objects.values('area_of_law').annotate(count=Count('id'))

        data = {
            'total_students': total_students,
            'matched_students': matched_students,
            'pending_matches': pending_matches,
            'needs_approval': needs_approval,
            'total_organizations': total_orgs,
            'available_positions': available_positions,
            'ungraded_statements': ungraded_statements,
            'matches_by_status': list(matches_by_status),
            'matches_by_area': list(matches_by_area),
        }
        return Response(data)

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

class ImportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if 'csv_file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=400)

        csv_file = request.FILES['csv_file']
        try:
            # Read and process CSV file
            df = pd.read_csv(csv_file)
            required_columns = ['given_names', 'last_name', 'email', 'student_id', 'program']
            if not all(col in df.columns for col in required_columns):
                return Response({'error': 'Missing required columns'}, status=400)

            # Create student records
            created_count = 0
            for _, row in df.iterrows():
                Student.objects.update_or_create(
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
                created_count += 1

            return Response({'message': f'Successfully imported {created_count} students'})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class ImportPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        pdf_file = request.FILES.get('pdf_file')
        if not pdf_file:
            return Response(
                {'error': 'No PDF file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            process_pdf_file(pdf_file)
            return Response({'message': 'Successfully imported grades from PDF'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('firstName')
        last_name = request.data.get('lastName')
        role = request.data.get('role', 'Admin')
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the user
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
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': role,
            }
        }, status=status.HTTP_201_CREATED)