"""
File: backend/sail/services/matching_algorithm.py
Purpose: Implementation of the student-organization matching algorithm
"""

from ..models import StudentProfile, OrganizationProfile, MatchingRound

def run_matching(round_number):
    """
    Basic example: find all unmatched students, pair them with an organization
    that has available_positions > filled_positions.
    """
    matching_round, _ = MatchingRound.objects.get_or_create(round_number=round_number)

    # fetch all unmatched students
    students = StudentProfile.objects.filter(is_matched=False)
    total = students.count()
    matched_count = 0

    for student in students:
        org = OrganizationProfile.objects.filter(filled_positions__lt=models.F('available_positions')).first()
        if org:
            student.is_matched = True
            org.filled_positions += 1
            org.save()
            student.save()
            matched_count += 1

    matching_round.matched_count = matched_count
    matching_round.total_students = total
    matching_round.status = 'completed'
    matching_round.save()
    return matching_round
