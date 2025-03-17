"""
backend/sail/services/pdf_grades_parser.py
-------------------------------------------------
Parses PDFs (like dhaliwal.pdf) for student ID and grades.
"""

import re
import logging
from pypdf import PdfReader
from django.core.exceptions import ValidationError
from ..models import StudentProfile, StudentGrade

logger = logging.getLogger(__name__)

VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']

class GradeParserError(Exception):
    pass

def validate_grade(grade: str) -> str:
    if grade.upper() in VALID_GRADES:
        return grade.upper()
    raise ValidationError(f'Invalid grade: {grade}')

def parse_grades_pdf(pdf_path: str) -> StudentGrade:
    try:
        with open(pdf_path, 'rb') as f:
            reader = PdfReader(f)
            text_data = [page.extract_text() for page in reader.pages]
            full_text = "\n".join(text_data)

        # Extract student ID
        sid_match = re.search(r"Student\s*ID[:\s]*(\d+)", full_text, re.IGNORECASE)
        if not sid_match:
            raise GradeParserError('Could not find student ID in PDF')

        sid = sid_match.group(1)
        try:
            student = StudentProfile.objects.get(student_id=sid)
        except StudentProfile.DoesNotExist:
            raise GradeParserError(f'Student with ID {sid} not found')

        # Create or get StudentGrade
        sg, _ = StudentGrade.objects.get_or_create(student_profile=student)

        # Parse grades with improved regex patterns
        grade_patterns = {
            'constitutional_law': r"Constitutional\s*Law[\s\-:]*([A-D][+-]?)",
            'contracts': r"Contracts[\s\-:]*([A-D][+-]?)",
            'criminal_law': r"Criminal\s*Law[\s\-:]*([A-D][+-]?)",
            'property_law': r"Property\s*Law[\s\-:]*([A-D][+-]?)",
            'torts': r"Torts[\s\-:]*([A-D][+-]?)",
            'lrw_case_brief': r"Case\s*Brief[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'lrw_multi_case': r"Multiple\s*Case\s*Analysis[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'lrw_memo': r"Short\s*Legal\s*Memorandum[\s\-:]*([A-D][+-]?|\d+/\d+)",
        }

        for field, pattern in grade_patterns.items():
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                try:
                    grade = validate_grade(match.group(1))
                    setattr(sg, field, grade)
                except ValidationError as e:
                    logger.warning(f'Invalid grade format for {field}: {e}')

        sg.save()
        return sg

    except Exception as e:
        logger.error(f'Error parsing PDF grades: {str(e)}')
        raise GradeParserError(f'Failed to parse grades: {str(e)}')