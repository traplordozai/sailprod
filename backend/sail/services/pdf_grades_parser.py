"""
backend/sail/services/pdf_grades_parser.py
-------------------------------------------------
Parses PDFs (like dhaliwal.pdf) for student ID and grades.
"""

import re
import pypdf
from ..models import StudentProfile, StudentGrade

def parse_grades_pdf(pdf_path):
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        text_data = []
        for page in reader.pages:
            text_data.append(page.extract_text())
    full_text = "\n".join(text_data)

    # naive example: look for "Student ID: <digits>"
    sid_match = re.search(r"Student ID:\s*(\d+)", full_text)
    if not sid_match:
        return None

    sid = sid_match.group(1)
    try:
        student = StudentProfile.objects.get(student_id=sid)
    except StudentProfile.DoesNotExist:
        return None

    # create or get StudentGrade
    sg, _ = StudentGrade.objects.get_or_create(student_profile=student)

    # parse letter grades
    # Example: "Constitutional Law – A" or "Case Brief grade: 5/5"
    # You must adapt regex to your actual PDF format

    # For demonstration:
    cons = re.search(r"Constitutional Law.*?([A-D][\+\-]?)", full_text)
    if cons:
        sg.constitutional_law = cons.group(1)

    # Repeat for other classes...
    # e.g. "Contracts – B+", "Criminal Law – A", etc.
    # For LRW subgrades:
    case_brief = re.search(r"Case Brief grade:\s*(\S+)", full_text)
    if case_brief:
        sg.lrw_case_brief = case_brief.group(1)

    sg.save()
    return sg