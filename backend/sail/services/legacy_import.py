import warnings
from ..parsers.student_csv_parser import StudentCSVParser
from ..parsers.organization_csv_parser import OrganizationCSVParser
from ..parsers.pdf_parser import PDFGradeParser

def import_students_from_csv(filepath, user=None):
    """Legacy wrapper for student CSV import"""
    warnings.warn(
        "This function is deprecated. Use StudentCSVParser directly.",
        DeprecationWarning, stacklevel=2
    )
    parser = StudentCSVParser(filepath, imported_by=user.username if user else None)
    students, errors = parser.parse()
    return {"students": students, "errors": errors}

def parse_grades_pdf(pdf_path, user=None):
    """Legacy wrapper for PDF grade parsing"""
    warnings.warn(
        "This function is deprecated. Use PDFGradeParser directly.",
        DeprecationWarning, stacklevel=2
    )
    parser = PDFGradeParser(pdf_path, imported_by=user.username if user else None)
    grades, errors = parser.parse()
    return {
        "success": len(grades) > 0,
        "student_id": grades[0].student_profile.student_id if grades else None,
        "grades": {field: getattr(grades[0], field) for field in
                  ['constitutional_law', 'contracts', 'criminal_law',
                   'property_law', 'torts', 'lrw_case_brief',
                   'lrw_multiple_case', 'lrw_short_memo'] if grades},
        "message": "Successfully parsed grades" if grades else "No grades parsed",
    }