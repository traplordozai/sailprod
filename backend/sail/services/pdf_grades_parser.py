"""
backend/sail/services/pdf_grades_parser.py
-------------------------------------------------
Parses PDFs (like dhaliwal.pdf) for student ID and grades.
"""

import re
import logging
import json
import os
from pypdf import PdfReader
from django.core.exceptions import ValidationError
from django.utils import timezone
from ..models import StudentProfile, StudentGrade, ImportLog

logger = logging.getLogger(__name__)

VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']

class GradeParserError(Exception):
    pass

def validate_grade(grade: str) -> str:
    """
    Validates that a grade is in the expected format (A+, B-, etc.)
    """
    if grade.upper() in VALID_GRADES:
        return grade.upper()
    
    # Check if it's a number/total format (e.g., 80/100)
    if '/' in grade:
        parts = grade.split('/')
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            return grade
    
    raise ValidationError(f'Invalid grade: {grade}')

def parse_grades_pdf(pdf_path: str, user=None) -> dict:
    """
    Parses a PDF file containing student grades.
    Extracts student ID and all available grades.
    Returns a dict with results or error information.
    """
    # Create import log entry
    import_log = ImportLog.objects.create(
        file_name=os.path.basename(pdf_path),
        import_type='pdf',
        imported_by=user.username if user else None
    )
    
    errors = []
    result = {
        'success': False,
        'message': '',
        'student_id': None,
        'grades': {}
    }
    
    try:
        # Extract text from PDF
        with open(pdf_path, 'rb') as f:
            reader = PdfReader(f)
            text_data = [page.extract_text() for page in reader.pages]
            full_text = "\n".join(text_data)
        
        # Extract student information
        student_name = None
        name_match = re.search(r"For\s*\[([^]]+)\]", full_text, re.IGNORECASE)
        if name_match:
            student_name = name_match.group(1).strip()
        
        # Extract student ID
        sid_match = re.search(r"Student\s*ID[:\s]*\[?(\d+)\]?", full_text, re.IGNORECASE)
        if not sid_match:
            error_msg = 'Could not find student ID in PDF'
            errors.append(error_msg)
            result['message'] = error_msg
            raise GradeParserError(error_msg)
        
        sid = sid_match.group(1).strip()
        result['student_id'] = sid
        
        # Find student in database
        try:
            student = StudentProfile.objects.get(student_id=sid)
        except StudentProfile.DoesNotExist:
            # If student doesn't exist but we have a name, create them
            if student_name:
                # Split name into first and last (simple approach)
                name_parts = student_name.split()
                first_name = name_parts[0] if name_parts else ""
                last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
                
                student = StudentProfile.objects.create(
                    student_id=sid,
                    first_name=first_name,
                    last_name=last_name
                )
                logger.info(f"Created new student profile for {student_name} ({sid})")
            else:
                error_msg = f'Student with ID {sid} not found'
                errors.append(error_msg)
                result['message'] = error_msg
                raise GradeParserError(error_msg)
        
        # Create or get StudentGrade
        sg, created = StudentGrade.objects.get_or_create(student_profile=student)
        
        # Parse grades with improved regex patterns
        grade_patterns = {
            'constitutional_law': r"Constitution[al]*\s*Law[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'contracts': r"Contracts[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'criminal_law': r"Criminal\s*Law[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'property_law': r"Property\s*Law[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'torts': r"Torts[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'lrw_case_brief': r"Case\s*Brief[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'lrw_multiple_case': r"Multiple\s*Case\s*Analysis[\s\-:]*([A-D][+-]?|\d+/\d+)",
            'lrw_short_memo': r"(Short\s*Legal\s*Memorandum|Legal\s*Memo)[\s\-:]*([A-D][+-]?|\d+/\d+)",
        }
        
        grades_found = 0
        
        for field, pattern in grade_patterns.items():
            match = re.search(pattern, full_text, re.IGNORECASE)
            if match:
                try:
                    # For lrw_short_memo, the grade is in group 2
                    grade_group = 2 if field == 'lrw_short_memo' and match.group(2) else 1
                    grade = match.group(grade_group)
                    valid_grade = validate_grade(grade)
                    setattr(sg, field, valid_grade)
                    result['grades'][field] = valid_grade
                    grades_found += 1
                except ValidationError as e:
                    error_msg = f'Invalid grade format for {field}: {e}'
                    logger.warning(error_msg)
                    errors.append(error_msg)
        
        # Save if we found any grades
        if grades_found > 0:
            sg.save()
            result['success'] = True
            result['message'] = f'Successfully parsed {grades_found} grades for Student ID {sid}'
        else:
            error_msg = f'No valid grades found in PDF for Student ID {sid}'
            errors.append(error_msg)
            result['message'] = error_msg
        
    except GradeParserError as e:
        # Specific parser errors already handled
        pass
        
    except Exception as e:
        error_msg = f'Error parsing PDF grades: {str(e)}'
        logger.exception(error_msg)
        errors.append(error_msg)
        result['message'] = error_msg
    
    # Update import log
    import_log.success_count = 1 if result['success'] else 0
    import_log.error_count = len(errors)
    import_log.errors = json.dumps(errors) if errors else None
    import_log.save()
    
    return result