"""
backend/sail/services/csv_import.py
------------------------------------------
Imports data from SA1L_deduplicated.csv into StudentProfile + Statement.
"""

import csv
import os
from ..models import StudentProfile, Statement

def import_students_from_csv(csv_path):
    with open(csv_path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row.get('Student ID') or row.get('Alternate ID')
            if not sid:
                continue

            first_name = row.get('Given names', '')
            last_name = row.get('Last name', '')
            email = row.get('Student Email') or row.get('Alternate Email')
            program = row.get('Programs chosen')
            areas_of_law = row.get('Areas of law')

            # location/work preferences
            location_pref = row.get('Location Preference')
            work_pref = row.get('Work Preferences')

            student, created = StudentProfile.objects.get_or_create(
                student_id=sid,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                    'program': program,
                    'areas_of_law': areas_of_law,
                    'location_preferences': location_pref,
                    'work_preferences': work_pref,
                }
            )
            if not created:
                # update existing
                student.first_name = first_name
                student.last_name = last_name
                student.email = email
                student.program = program
                student.areas_of_law = areas_of_law
                student.location_preferences = location_pref
                student.work_preferences = work_pref
                student.save()

            # parse statements from multiple columns if needed
            # e.g. row['Statement1'], row['Statement2']...
            # here we show an example for a single statement:
            statement_content = row.get('StatementOfInterest', '')
            if statement_content:
                Statement.objects.create(
                    student_profile=student,
                    content=statement_content
                )