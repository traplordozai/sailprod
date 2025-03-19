"""
File: backend/sail/parsers/pdf_parser.py
Purpose: Parser for extracting grade information from PDF files
"""

import re
import io
import logging
from typing import Dict, List, Any, Optional, Tuple
import pdfplumber

from .base import BaseParser
from ..models import StudentProfile, StudentGrade

logger = logging.getLogger(__name__)

class PDFGradeParser(BaseParser):
    """Parser for student grade data from PDF files"""

    def __init__(self, file_path: str, imported_by: str = None):
        super().__init__(file_path, 'pdf', imported_by)

    def extract_text_from_pdf(self) -> str:
        """Extract all text from a PDF file"""
        try:
            with pdfplumber.open(self.file_path) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
                return text
        except Exception as e:
            self.log_error(f"Failed to extract text from PDF: {str(e)}")
            return ""

    def parse_student_info(self, text: str) -> Optional[Dict[str, str]]:
        """
        Extract student identifying information from PDF text

        Returns:
            Dict with student ID, first name, and last name, or None if not found
        """
        # Match common patterns for student ID
        id_match = re.search(r'(?:Student|ID)[\s#:]+([A-Z0-9]+)', text, re.IGNORECASE)

        # Match patterns for student name
        name_match = re.search(r'(?:Name|Student)[\s:]+([A-Za-z\s,.-]+)', text, re.IGNORECASE)

        if not id_match and not name_match:
            self.log_error("Could not find student ID or name in PDF")
            return None

        student_info = {}

        if id_match:
            student_info['student_id'] = id_match.group(1).strip()

        if name_match:
            full_name = name_match.group(1).strip()

            # Try to split into first and last name
            name_parts = full_name.split()
            if len(name_parts) >= 2:
                student_info['first_name'] = name_parts[0]
                student_info['last_name'] = ' '.join(name_parts[1:])
            else:
                student_info['full_name'] = full_name

        return student_info

    def parse_grades(self, text: str) -> Dict[str, str]:
        """Extract course grades from PDF text"""
        grades = {}

        # Define grade patterns for main courses
        course_patterns = {
            'constitutional_law': r'Constitutional Law[:\s]+([A-F][\+\-]?)',
            'contracts': r'Contracts[:\s]+([A-F][\+\-]?)',
            'criminal_law': r'Criminal Law[:\s]+([A-F][\+\-]?)',
            'property_law': r'Property[:\s]+([A-F][\+\-]?)',
            'torts': r'Torts[:\s]+([A-F][\+\-]?)',
        }

        # Extract main course grades
        for field, pattern in course_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                grades[field] = match.group(1)

        # Define LRW assignment patterns
        lrw_patterns = {
            'lrw_case_brief': r'Case Brief[:\s]+([A-F][\+\-]?)',
            'lrw_multiple_case': r'Multiple Case Analysis[:\s]+([A-F][\+\-]?)',
            'lrw_short_memo': r'Short Legal Memorandum[:\s]+([A-F][\+\-]?)',
        }

        # Extract LRW grades
        for field, pattern in lrw_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                grades[field] = match.group(1)

        return grades

    def parse(self) -> Tuple[List[StudentGrade], List[Dict]]:
        """
        Parse the PDF file and update student grade records

        Returns:
            Tuple containing:
                - List of created/updated StudentGrade objects
                - List of error dictionaries
        """
        text = self.extract_text_from_pdf()
        if not text:
            return [], self.errors

        # Parse student information
        student_info = self.parse_student_info(text)
        if not student_info:
            return [], self.errors

        # Try to find the student
        student = None
        if 'student_id' in student_info:
            try:
                student = StudentProfile.objects.get(student_id=student_info['student_id'])
            except StudentProfile.DoesNotExist:
                self.log_error(f"No student found with ID: {student_info['student_id']}")

        # If not found by ID, try name-based lookup as fallback
        if not student and 'first_name' in student_info and 'last_name' in student_info:
            try:
                student = StudentProfile.objects.get(
                    first_name=student_info['first_name'],
                    last_name=student_info['last_name']
                )
            except (StudentProfile.DoesNotExist, StudentProfile.MultipleObjectsReturned):
                error_msg = f"Could not uniquely identify student: {student_info.get('first_name', '')} {student_info.get('last_name', '')}"
                self.log_error(error_msg)

        if not student:
            return [], self.errors

        # Parse grades
        grades_data = self.parse_grades(text)
        if not grades_data:
            self.log_error(f"No grades found for student {student.student_id}")
            return [], self.errors

        # Update or create student grades
        try:
            grades, created = StudentGrade.objects.get_or_create(student_profile=student)

            # Update grade fields
            for field, value in grades_data.items():
                setattr(grades, field, value)

            grades.save()
            self.success_count += 1

            # Create import log
            self.create_import_log()

            return [grades], self.errors

        except Exception as e:
            self.log_error(f"Error saving grades: {str(e)}")
            return [], self.errors
