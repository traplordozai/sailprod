from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.utils import timezone
from .models import Student, Grade, Statement, Organization, Match
from .serializers import (
    StudentSerializer, GradeSerializer, StatementSerializer,
    OrganizationSerializer, MatchSerializer, DashboardStatsSerializer
)
from .utils import process_csv_file, process_pdf_file

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
        stats = {
            'total_students': Student.objects.count(),
            'matched_students': Student.objects.filter(matches__status='APPROVED').distinct().count(),
            'pending_matches': Match.objects.filter(status='PENDING').count(),
            'needs_approval': Match.objects.filter(status='PENDING').count(),
            'total_organizations': Organization.objects.count(),
            'available_positions': Organization.objects.aggregate(total=Sum('available_positions'))['total'],
            'ungraded_statements': Statement.objects.filter(grade__isnull=True).count(),
            'matches_by_status': Match.objects.values('status').annotate(count=Count('id')),
            'matches_by_area': Match.objects.values('area_of_law').annotate(count=Count('id')),
        }
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

class ImportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        csv_file = request.FILES.get('csv_file')
        if not csv_file:
            return Response(
                {'error': 'No CSV file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            process_csv_file(csv_file)
            return Response({'message': 'Successfully imported students from CSV'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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