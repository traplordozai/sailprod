import pandas as pd
import PyPDF2
import io
from django.core.files.base import ContentFile
from .models import Student, Grade, Statement

def process_csv_file(csv_file):
    """
    Process the SA1L_deduplicated.csv file and create/update student records
    """
    df = pd.read_csv(csv_file)
    
    for _, row in df.iterrows():
        # Get student email (try column G first, then J)
        email = row['G'] if pd.notna(row['G']) else row['J']
        
        # Get student ID (try column H first, then I)
        student_id = row['H'] if pd.notna(row['H']) else row['I']
        
        # Create or update student
        student, created = Student.objects.update_or_create(
            email=email,
            defaults={
                'given_names': row['F'],
                'last_name': row['E'],
                'student_id': student_id,
                'program': row['K'],
                'location_preferences': row['AP'].split(',') if pd.notna(row['AP']) else [],
                'work_preferences': row['AQ'].split(',') if pd.notna(row['AQ']) else [],
                'areas_of_interest': row['L'].split(',') if pd.notna(row['L']) else [],
                'area_rankings': _process_area_rankings(row),
                'is_self_proposed': row['K'] == 'self-proposed' if pd.notna(row['K']) else False,
                'self_proposed_org': row['AH'] if pd.notna(row['AH']) else None,
                'self_proposed_area': row['AI'] if pd.notna(row['AI']) else None,
                'self_proposed_supervisor': row['AJ'] if pd.notna(row['AJ']) else None,
                'self_proposed_role': row['AK'] if pd.notna(row['AK']) else None,
                'self_proposed_email': row['AL'] if pd.notna(row['AL']) else None,
                'self_proposed_contact': row['AM'] if pd.notna(row['AM']) else None,
                'self_proposed_statement': row['AN'] if pd.notna(row['AN']) else None,
            }
        )
        
        # Process statements
        for col in range(ord('V'), ord('AD') + 1):
            col_letter = chr(col)
            if pd.notna(row[col_letter]):
                Statement.objects.update_or_create(
                    student=student,
                    area_of_law=_get_area_from_column(col_letter),
                    defaults={'content': row[col_letter]}
                )

def process_pdf_file(pdf_file):
    """
    Process a student's grade PDF file and create/update grade records
    """
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = pdf_reader.pages[0].extract_text()
    
    # Extract student information
    student_id = _extract_student_id(text)
    student = Student.objects.get(student_id=student_id)
    
    # Extract grades
    grades = _extract_grades(text)
    
    # Create or update grade record
    Grade.objects.update_or_create(
        student=student,
        defaults={
            'constitutional_law': grades.get('constitutional_law'),
            'contracts': grades.get('contracts'),
            'criminal_law': grades.get('criminal_law'),
            'property_law': grades.get('property_law'),
            'torts': grades.get('torts'),
            'case_brief': grades.get('case_brief'),
            'multiple_case_analysis': grades.get('multiple_case_analysis'),
            'short_legal_memo': grades.get('short_legal_memo'),
            'grade_pdf': ContentFile(pdf_file.read(), name=pdf_file.name)
        }
    )

def _process_area_rankings(row):
    """
    Process the area rankings from columns M to U
    """
    rankings = {}
    for col in range(ord('M'), ord('U') + 1):
        col_letter = chr(col)
        if pd.notna(row[col_letter]):
            rankings[_get_area_from_column(col_letter)] = int(row[col_letter])
    return rankings

def _get_area_from_column(col_letter):
    """
    Map column letters to area of law codes
    """
    area_mapping = {
        'M': 'SJHR',  # Social Justice and Human Rights Law
        'N': 'PIL',   # Public Interest Law
        'O': 'PCL',   # Private/Civil Law
        'P': 'IL',    # International Law
        'Q': 'EL',    # Environmental Law
        'R': 'LL',    # Labour Law
        'S': 'FL',    # Family Law
        'T': 'BL',    # Business Law
        'U': 'IP',    # Intellectual Property
        'V': 'SJHR',  # Statement columns
        'W': 'PIL',
        'X': 'PCL',
        'Y': 'IL',
        'Z': 'EL',
        'AA': 'LL',
        'AB': 'FL',
        'AC': 'BL',
        'AD': 'IP',
    }
    return area_mapping.get(col_letter)

def _extract_student_id(text):
    """
    Extract student ID from PDF text
    """
    # TODO: Implement PDF text parsing to extract student ID
    # This will need to be customized based on the actual PDF format
    pass

def _extract_grades(text):
    """
    Extract grades from PDF text
    """
    # TODO: Implement PDF text parsing to extract grades
    # This will need to be customized based on the actual PDF format
    grades = {}
    # Example format:
    # grades = {
    #     'constitutional_law': 'A',
    #     'contracts': 'B+',
    #     'criminal_law': 'A-',
    #     'property_law': 'B',
    #     'torts': 'A',
    #     'case_brief': 'A-',
    #     'multiple_case_analysis': 'B+',
    #     'short_legal_memo': 'A',
    # }
    return grades 