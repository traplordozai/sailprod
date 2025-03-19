# backend/sail/views/import_views.py
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
import os
import uuid
import logging

from ..models import ImportLog
from ..serializers import ImportLogSerializer
from ..parsers.student_csv_parser import StudentCSVParser
from ..parsers.organization_csv_parser import OrganizationCSVParser
from ..parsers.pdf_parser import PDFGradeParser

logger = logging.getLogger(__name__)

class ImportViewSet(viewsets.ModelViewSet):
    """
    API endpoints for importing data
    """
    queryset = ImportLog.objects.all().order_by('-created_at')
    serializer_class = ImportLogSerializer
    permission_classes = [permissions.IsAdminUser]

    def _handle_uploaded_file(self, file):
        """Save uploaded file to temporary location"""
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        filename = f"{uuid.uuid4()}_{file.name}"
        filepath = os.path.join(upload_dir, filename)

        # Save file
        with open(filepath, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        return filepath

    @action(detail=False, methods=['post'])
    def import_student_csv(self, request):
        """Import student data from CSV"""
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

        # Save file
        filepath = self._handle_uploaded_file(file)

        # Parse file
        parser = StudentCSVParser(
            filepath,
            imported_by=request.user.username
        )
        students, errors = parser.parse()

        # Delete temporary file
        try:
            os.remove(filepath)
        except Exception as e:
            logger.error(f"Error deleting temporary file: {e}")

        return Response({
            "message": f"Imported {len(students)} students with {len(errors)} errors",
            "success_count": len(students),
            "error_count": len(errors),
            "errors": errors
        })

    @action(detail=False, methods=['post'])
    def import_organization_csv(self, request):
        """Import organization data from CSV"""
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

        # Save file
        filepath = self._handle_uploaded_file(file)

        # Parse file
        parser = OrganizationCSVParser(
            filepath,
            imported_by=request.user.username
        )
        organizations, errors = parser.parse()

        # Clean up temporary file
        if os.path.exists(filepath):
            os.remove(filepath)

        return Response({
            "success": True,
            "created_or_updated": len(organizations),
            "errors": len(errors),
            "error_details": errors
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def import_grades_pdf(self, request):
        """Import student grades from PDF"""
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']
        if not file.name.lower().endswith('.pdf'):
            return Response({"error": "File must be a PDF"}, status=status.HTTP_400_BAD_REQUEST)

        # Save file
        filepath = self._handle_uploaded_file(file)

        # Parse file
        parser = PDFGradeParser(
            filepath,
            imported_by=request.user.username
        )
        grades, errors = parser.parse()

        # Clean up temporary file
        if os.path.exists(filepath):
            os.remove(filepath)

        return Response({
            "success": len(grades) > 0,
            "updated": len(grades),
            "errors": len(errors),
            "error_details": errors
        }, status=status.HTTP_200_OK)