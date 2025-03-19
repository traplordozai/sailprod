"""
backend/sail/tasks.py
--------------------------
Celery tasks for background processing of uploads and other operations
"""

import os
import logging
from celery import shared_task
from django.conf import settings
from .services import import_students_from_csv, parse_grades_pdf

logger = logging.getLogger(__name__)

@shared_task
def process_csv_import_task(file_path, user_id=None):
    """
    Process CSV import in the background
    
    Args:
        file_path: Path to the uploaded CSV file
        user_id: ID of the user who uploaded the file (optional)
    
    Returns:
        dict: Results with success/error counts and details
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = None
    
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User with ID {user_id} not found")
    
    try:
        logger.info(f"Processing CSV import: {file_path}")
        results = import_students_from_csv(file_path, user)
        
        # Clean up the file after import
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Removed temporary CSV file: {file_path}")
            except Exception as e:
                logger.error(f"Error removing temporary file {file_path}: {str(e)}")
        
        return results
        
    except Exception as e:
        logger.exception(f"Error in CSV import task: {str(e)}")
        return {
            'success_count': 0,
            'error_count': 1,
            'errors': [f"Task error: {str(e)}"]
        }

@shared_task
def process_pdf_grades_task(file_path, student_id=None, user_id=None):
    """
    Process PDF grades in the background
    
    Args:
        file_path: Path to the uploaded PDF file
        student_id: Student ID the grades belong to
        user_id: ID of the user who uploaded the file (optional)
    
    Returns:
        dict: Results with success status and details
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = None
    
    if user_id:
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User with ID {user_id} not found")
    
    try:
        logger.info(f"Processing PDF grades for student {student_id}: {file_path}")
        result = parse_grades_pdf(file_path, user)
        
        # Clean up the file after import
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Removed temporary PDF file: {file_path}")
            except Exception as e:
                logger.error(f"Error removing temporary file {file_path}: {str(e)}")
        
        return result
        
    except Exception as e:
        logger.exception(f"Error in PDF grades task: {str(e)}")
        return {
            'success': False,
            'message': f"Task error: {str(e)}",
            'student_id': student_id,
            'grades': {}
        }
