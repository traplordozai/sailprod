"""
backend/sail/services/csv_import.py
------------------------------------------
Imports data from SA1L_deduplicated.csv into StudentProfile + Statement.
"""

import pandas as pd
import logging
import json
from django.db import transaction
from ..models import (
    StudentProfile, Statement, AreaOfLaw, 
    StudentAreaRanking, SelfProposedExternship, ImportLog
)

logger = logging.getLogger(__name__)

def import_students_from_csv(csv_path, user=None):
    """
    Parses the SA1L CSV file using pandas and returns a summary
    of records created/updated plus any errors that need review.
    """
    # Create import log entry
    import_log = ImportLog.objects.create(
        file_name=csv_path.split('/')[-1],
        import_type='csv',
        imported_by=user.username if user else None
    )
    
    errors = []
    success_count = 0
    
    try:
        # 1) Read CSV with pandas
        df = pd.read_csv(csv_path, dtype=str).fillna("")
        
        # 2) Clean up column headers
        df.columns = [col.strip() for col in df.columns]
        
        # 3) Use transaction so if anything fails, the DB doesn't get partial data
        with transaction.atomic():
            for idx, row in df.iterrows():
                try:
                    # Identify student fields
                    student_id = row.get("Student ID", "").strip() or row.get("ID", "").strip()
                    if not student_id:
                        errors.append(f"Row {idx}: Missing Student ID")
                        continue
                    
                    given_names = row.get("Given Names", "").strip()
                    last_name = row.get("Last Name", "").strip()
                    
                    # Get email address
                    primary_email = row.get("Student Email", "").strip()
                    backup_email = row.get("Alternate Email", "").strip()
                    
                    # Get program info
                    program_chosen = row.get("Programs chosen", "").strip()
                    
                    # Check for self-proposed in program chosen
                    is_self_proposed = ("self-proposed" in program_chosen.lower())
                    
                    # 4) Check for existing student or create new one
                    student, created = StudentProfile.objects.get_or_create(
                        student_id=student_id,
                        defaults={
                            "first_name": given_names,
                            "last_name": last_name,
                            "email": primary_email,
                            "backup_email": backup_email,
                            "program_chosen": program_chosen,
                        }
                    )
                    
                    # 5) Update if existing
                    if not created:
                        student.first_name = given_names or student.first_name
                        student.last_name = last_name or student.last_name
                        student.email = primary_email or student.email
                        student.backup_email = backup_email or student.backup_email
                        student.program_chosen = program_chosen or student.program_chosen
                        student.save()
                    
                    # 6) Parse areas of law ranking
                    area_columns = [
                        "Social Justice and Human Rights Law",
                        "Public Interest Law",
                        "Private/Civil Law", 
                        "International Law",
                        "Environmental Law",
                        "Labour Law",
                        "Family Law",
                        "Business Law",
                        "Intellectual Property",
                    ]
                    
                    # Track ranks to detect duplicates
                    rank_dict = {}
                    
                    for area_name in area_columns:
                        if area_name in df.columns:
                            rank_val_str = row.get(area_name, "").strip()
                            # Validate rank (must be int 1..5 or blank)
                            if rank_val_str.isdigit():
                                rank_val = int(rank_val_str)
                                if 1 <= rank_val <= 5:
                                    # Check for duplicate ranks
                                    if rank_val in rank_dict:
                                        errors.append(
                                            f"Row {idx}: duplicate rank {rank_val} for {rank_dict[rank_val]} and {area_name}"
                                        )
                                    else:
                                        rank_dict[rank_val] = area_name
                                        
                                        # Get or create the area of law
                                        area_obj, _ = AreaOfLaw.objects.get_or_create(name=area_name)
                                        
                                        # Get or create the ranking
                                        sar, _ = StudentAreaRanking.objects.get_or_create(
                                            student_profile=student,
                                            area=area_obj
                                        )
                                        sar.rank = rank_val
                                        sar.save()
                                else:
                                    errors.append(
                                        f"Row {idx}: invalid rank {rank_val_str} for area {area_name}"
                                    )
                            elif rank_val_str:
                                # It's not blank, but also not a digit => error
                                errors.append(
                                    f"Row {idx}: non-numeric rank '{rank_val_str}' for area {area_name}"
                                )
                    
                    # 7) Parse statements of interest
                    statements = []
                    for col_name in ["Statement1", "Statement2", "Statement3", "Statement4", "Statement5"]:
                        if col_name in df.columns and row.get(col_name, "").strip():
                            statements.append(row[col_name].strip())
                            
                            # Also create separate Statement model entries
                            Statement.objects.create(
                                student_profile=student,
                                content=row[col_name].strip()
                            )
                    
                    # Update statements array
                    if statements:
                        student.statements_of_interest = statements
                        student.save()
                    
                    # 8) Self-proposed Externship details
                    if is_self_proposed:
                        org_name = row.get("Organization", "").strip()
                        supervisor = row.get("Supervisor", "").strip()
                        sup_email = row.get("Supervisor Email", "").strip()
                        address = row.get("Organization Address", "").strip()
                        website = row.get("Organization Website", "").strip()
                        
                        # Create or update self-proposed externship
                        sp, _ = SelfProposedExternship.objects.get_or_create(
                            student_profile=student
                        )
                        sp.organization = org_name
                        sp.supervisor = supervisor
                        sp.supervisor_email = sup_email
                        sp.address = address
                        sp.website = website
                        sp.save()
                    
                    # 9) Location/work preferences
                    loc_pref_str = row.get("Location Preference", "").strip()
                    if loc_pref_str:
                        loc_prefs = [loc.strip() for loc in loc_pref_str.split(";")]
                        student.location_preferences = loc_prefs
                        student.location_preferences_text = loc_pref_str
                    
                    work_pref_str = row.get("Work Preferences", "").strip()
                    if work_pref_str:
                        work_prefs = [wp.strip() for wp in work_pref_str.split(";")]
                        student.work_preferences = work_prefs
                        student.work_preferences_text = work_pref_str
                    
                    student.save()
                    success_count += 1
                
                except Exception as e:
                    err_msg = f"Row {idx}: {str(e)}"
                    logger.error(err_msg)
                    errors.append(err_msg)
    
    except Exception as e:
        logger.exception(f"Error during CSV import: {str(e)}")
        errors.append(f"Fatal error: {str(e)}")
    
    # Update import log with results
    import_log.success_count = success_count
    import_log.error_count = len(errors)
    import_log.errors = json.dumps(errors) if errors else None
    import_log.save()
    
    return {
        'success_count': success_count,
        'error_count': len(errors),
        'errors': errors
    }