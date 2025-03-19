"""
backend/sail/services/__init__.py
---------------------------------------
Imports for service modules.
"""

from ..parsers.student_csv_parser import StudentCSVParser
from ..parsers.pdf_parser import PDFGradeParser
from .matching_algorithm import run_matching
from .dashboard import get_dashboard_stats, get_recent_activity

def import_students_from_csv(file_path: str, imported_by=None):
    parser = StudentCSVParser(file_path, imported_by=imported_by)
    return parser.parse()

def parse_grades_pdf(file_path: str, imported_by=None):
    parser = PDFGradeParser(file_path, imported_by=imported_by)
    return parser.parse()

__all__ = [
    'import_students_from_csv',
    'parse_grades_pdf',
    'run_matching',
    'get_dashboard_stats',
    'get_recent_activity'
]