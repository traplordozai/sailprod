"""
File: backend/sail/parsers/student_csv_parser.py
Purpose: Parser for importing student data from CSV files
"""

import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from django.db import transaction

from .base import CSVParser
from ..models import StudentProfile, AreaOfLaw, StudentAreaRanking, SelfProposedExternship

class StudentCSVParser(CSVParser):
    """Parser for student data from CSV files"""

    def __init__(self, file_path: str, imported_by: str = None):
        super().__init__(file_path, 'csv', imported_by)

        # Define column patterns to search for
        self.column_patterns = {
            'student_id': ['id', 'student id', 'student_id'],
            'first_name': ['first name', 'firstname', 'first'],
            'last_name': ['last name', 'lastname', 'last'],
            'email': ['email', 'primary email'],
            'backup_email': ['backup email', 'secondary email', 'alternate email'],
            'program': ['program', 'degree'],
            'area_1': ['area 1', 'first area', '1st area', 'area of law 1'],
            'area_2': ['area 2', 'second area', '2nd area', 'area of law 2'],
            'area_3': ['area 3', 'third area', '3rd area', 'area of law 3'],
            'area_4': ['area 4', 'fourth area', '4th area', 'area of law 4'],
            'area_5': ['area 5', 'fifth area', '5th area', 'area of law 5'],
            'statement_1': ['statement 1', '1st statement', 'statement of interest 1'],
            'statement_2': ['statement 2', '2nd statement', 'statement of interest 2'],
            'statement_3': ['statement 3', '3rd statement', 'statement of interest 3'],
            'statement_4': ['statement 4', '4th statement', 'statement of interest 4'],
            'statement_5': ['statement 5', '5th statement', 'statement of interest 5'],
            'location_pref': ['location', 'location preference', 'preferred location'],
            'work_pref': ['work', 'work preference', 'work type', 'working preference'],
            'self_prop_org': ['self proposed organization', 'self-proposed organization'],
            'self_prop_sup': ['supervisor', 'self-proposed supervisor'],
            'self_prop_email': ['supervisor email', 'self-proposed email'],
        }

    def parse(self) -> Tuple[List[StudentProfile], List[Dict]]:
        """
        Parse the CSV file and create/update student records

        Returns:
            Tuple containing:
                - List of created/updated StudentProfile objects
                - List of error dictionaries
        """
        df = self.read_csv()
        if df.empty:
            return [], self.errors

        # Get column mappings
        column_map = self.get_column_map(df, self.column_patterns)

        # Ensure required columns exist
        required_columns = ['student_id', 'first_name', 'last_name']
        missing_columns = [col for col in required_columns if col not in column_map]

        if missing_columns:
            missing_names = ", ".join(missing_columns)
            self.log_error(f"Missing required columns: {missing_names}")
            return [], self.errors

        # Process each row
        created_or_updated = []

        for index, row in df.iterrows():
            try:
                with transaction.atomic():
                    # Extract basic info with safeguards
                    student_id = str(row[column_map['student_id']])

                    # Skip empty rows
                    if pd.isna(student_id) or student_id.strip() == '':
                        continue

                    # Get or create student profile
                    student, created = StudentProfile.objects.get_or_create(
                        student_id=student_id
                    )

                    # Update basic fields
                    for field, column in [
                        ('first_name', 'first_name'),
                        ('last_name', 'last_name'),
                        ('email', 'email'),
                        ('backup_email', 'backup_email'),
                        ('program', 'program'),
                    ]:
                        if column in column_map and not pd.isna(row[column_map[column]]):
                            setattr(student, field, row[column_map[column]])

                    # Process area rankings
                    area_ranks = []
                    for i in range(1, 6):
                        area_key = f'area_{i}'
                        if area_key in column_map and not pd.isna(row[column_map[area_key]]):
                            area_name = str(row[column_map[area_key]])
                            if area_name.strip():
                                area, _ = AreaOfLaw.objects.get_or_create(name=area_name)
                                area_ranks.append((area, i))

                    # Validate rankings (no duplicates)
                    area_names = [area.name for area, _ in area_ranks]
                    if len(area_names) != len(set(area_names)):
                        self.log_error(
                            "Duplicate area of law rankings found",
                            index,
                            {"student_id": student_id, "areas": area_names}
                        )

                    # Save student first to enable foreign key relationships
                    student.save()

                    # Clear existing rankings and create new ones
                    StudentAreaRanking.objects.filter(student_profile=student).delete()
                    for area, rank in area_ranks:
                        StudentAreaRanking.objects.create(
                            student_profile=student,
                            area=area,
                            rank=rank
                        )

                    # Store statements of interest
                    statements = []
                    for i in range(1, 6):
                        stmt_key = f'statement_{i}'
                        if stmt_key in column_map and not pd.isna(row[column_map[stmt_key]]):
                            stmt = str(row[column_map[stmt_key]])
                            if stmt.strip():
                                statements.append(stmt)

                    # Store statements as array
                    if statements:
                        student.statements_of_interest = statements

                    # Handle location preferences
                    if 'location_pref' in column_map and not pd.isna(row[column_map['location_pref']]):
                        locs = str(row[column_map['location_pref']])
                        student.location_preferences = [loc.strip() for loc in locs.split(';') if loc.strip()]
                        student.location_preferences_text = locs

                    # Handle work preferences
                    if 'work_pref' in column_map and not pd.isna(row[column_map['work_pref']]):
                        prefs = str(row[column_map['work_pref']])
                        student.work_preferences = [pref.strip() for pref in prefs.split(';') if pref.strip()]
                        student.work_preferences_text = prefs

                    # Handle self-proposed externship
                    has_self_proposed = False
                    for field in ['self_prop_org', 'self_prop_sup', 'self_prop_email']:
                        if field in column_map and not pd.isna(row[column_map[field]]):
                            has_self_proposed = True
                            break

                    if has_self_proposed:
                        self_prop, _ = SelfProposedExternship.objects.get_or_create(
                            student_profile=student
                        )

                        # Update self-proposed fields
                        if 'self_prop_org' in column_map and not pd.isna(row[column_map['self_prop_org']]):
                            self_prop.organization = str(row[column_map['self_prop_org']])

                        if 'self_prop_sup' in column_map and not pd.isna(row[column_map['self_prop_sup']]):
                            self_prop.supervisor = str(row[column_map['self_prop_sup']])

                        if 'self_prop_email' in column_map and not pd.isna(row[column_map['self_prop_email']]):
                            email = str(row[column_map['self_prop_email']])
                            if not self.validate_email(email):
                                self.log_error(
                                    f"Invalid supervisor email format: {email}",
                                    index,
                                    {"student_id": student_id}
                                )
                            else:
                                self_prop.supervisor_email = email

                        self_prop.save()

                    # Save student with all changes
                    student.save()
                    created_or_updated.append(student)
                    self.success_count += 1

            except Exception as e:
                self.log_error(f"Error processing row {index}: {str(e)}", index, {"row": row.to_dict()})

        # Create import log
        self.create_import_log()

        return created_or_updated, self.errors
