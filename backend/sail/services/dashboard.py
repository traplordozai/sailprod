"""
File: backend/sail/services/dashboard.py
Purpose: Services for generating dashboard statistics and metrics
"""

from django.db.models import Count, Q, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta
from ..models import (
    StudentProfile, OrganizationProfile, FacultyProfile,
    Statement, ImportLog, MatchingRound, AreaOfLaw, StudentAreaRanking
)

def get_dashboard_stats():
    """
    Calculate statistics for the admin dashboard.
    
    Returns:
        dict: Dictionary containing statistics and metrics
    """
    now = timezone.now()
    
    # Student stats
    total_students = StudentProfile.objects.count()
    matched_students = StudentProfile.objects.filter(is_matched=True).count()
    pending_matches = StudentProfile.objects.filter(is_active=True, is_matched=False).count()
    approval_needed = StudentProfile.objects.filter(admin_approval_needed=True).count()
    
    # Matches by status (for bar chart)
    match_status_counts = {
        'Pending': pending_matches,
        'Matched': matched_students,
        'Declined': StudentProfile.objects.filter(is_active=False, is_matched=False).count(),
        'Approved': StudentProfile.objects.filter(is_matched=True, admin_approval_needed=False).count(),
    }
    
    # Matches by area of law (for bar chart)
    # Get the top 5 areas of law by count of students who ranked them
    top_areas = StudentAreaRanking.objects.values('area__name') \
        .annotate(count=Count('student_profile')) \
        .order_by('-count')[:5]
        
    area_matches = {area['area__name']: area['count'] for area in top_areas}
    
    # If we don't have enough real data, add some sample areas to demonstrate
    if len(area_matches) < 5:
        sample_areas = {
            'Corporate': 25, 
            'Criminal': 18, 
            'Family': 22, 
            'IP': 15, 
            'Real Estate': 10
        }
        
        # Only add sample areas that don't exist in real data
        for area, count in sample_areas.items():
            if area not in area_matches and len(area_matches) < 5:
                area_matches[area] = count
    
    return {
        # Card metrics
        'total_students': total_students,
        'matched_students': matched_students,
        'pending_matches': pending_matches,
        'approval_needed': approval_needed,
        
        # Chart data
        'match_status_chart': [
            {'status': status, 'count': count} 
            for status, count in match_status_counts.items()
        ],
        'area_law_chart': [
            {'area': area, 'count': count} 
            for area, count in area_matches.items()
        ],
        
        # Legacy stats format (keeping for backward compatibility)
        'students': {
            'total': total_students,
            'active': StudentProfile.objects.filter(is_active=True).count(),
            'new': StudentProfile.objects.filter(created_at__gte=now-timedelta(days=7)).count(),
            'growth_rate': 0,
            'growth_type': 'increase',
        },
        'organizations': {
            'total': OrganizationProfile.objects.count(),
            'new': OrganizationProfile.objects.filter(created_at__gte=now-timedelta(days=7)).count(),
            'growth_rate': 0,
            'growth_type': 'increase',
        },
        'faculty': {
            'total': FacultyProfile.objects.count(),
            'new': FacultyProfile.objects.filter(created_at__gte=now-timedelta(days=7)).count(),
            'growth_rate': 0,
            'growth_type': 'increase',
        },
        'matching': {
            'rate': round((matched_students / total_students) * 100, 1) if total_students > 0 else 0,
            'matched_count': matched_students,
            'total_students': total_students,
            'growth_rate': 0,
            'growth_type': 'increase',
        }
    }

def get_recent_activity(limit=5):
    """
    Get recent system activity for the dashboard.
    
    Args:
        limit: Maximum number of activities to return
        
    Returns:
        list: List of recent activity items
    """
    recent_activity = []
    
    # Get recent student profile creations/updates
    recent_students = StudentProfile.objects.order_by('-updated_at')[:limit]
    for student in recent_students:
        is_new = student.created_at >= (timezone.now() - timedelta(days=1))
        activity_type = 'created profile' if is_new else 'updated profile'
        recent_activity.append({
            'id': f'student-{student.id}',
            'user': f'{student.first_name} {student.last_name}',
            'action': activity_type,
            'target': 'Student Profile',
            'date': student.updated_at
        })
    
    # Get recent organization updates
    recent_orgs = OrganizationProfile.objects.order_by('-updated_at')[:limit]
    for org in recent_orgs:
        is_new = org.created_at >= (timezone.now() - timedelta(days=1))
        activity_type = 'joined platform' if is_new else 'updated profile'
        recent_activity.append({
            'id': f'org-{org.id}',
            'user': org.name,
            'action': activity_type,
            'target': 'Organization Profile',
            'date': org.updated_at
        })
    
    # Get recent imports
    recent_imports = ImportLog.objects.order_by('-import_datetime')[:limit]
    for import_log in recent_imports:
        recent_activity.append({
            'id': f'import-{import_log.id}',
            'user': import_log.imported_by or 'System',
            'action': f"imported {import_log.import_type}",
            'target': import_log.file_name,
            'date': import_log.import_datetime
        })
    
    # Sort by date (newest first) and limit to requested amount
    sorted_activity = sorted(
        recent_activity, 
        key=lambda x: x['date'], 
        reverse=True
    )[:limit]
    
    # Format dates as strings
    for activity in sorted_activity:
        # Calculate relative time
        time_diff = timezone.now() - activity['date']
        hours_diff = time_diff.total_seconds() / 3600
        
        if hours_diff < 1:
            minutes = int(time_diff.total_seconds() / 60)
            activity['date_display'] = f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif hours_diff < 24:
            hours = int(hours_diff)
            activity['date_display'] = f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif hours_diff < 48:
            activity['date_display'] = "yesterday"
        else:
            days = int(hours_diff / 24)
            activity['date_display'] = f"{days} day{'s' if days != 1 else ''} ago"
    
    return sorted_activity 
