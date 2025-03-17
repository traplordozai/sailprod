"""
django_project/sail/models.py
-----------------------------
Core models for Student, Organization, Matching, etc.
"""

import uuid
from django.db import models
from django.conf import settings

class BaseModel(models.Model):
    """
    Abstract model with common fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class StudentProfile(BaseModel):
    """
    Holds data merged from CSV + PDF.
    """
    student_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, null=True)

    program = models.CharField(max_length=128, blank=True, null=True)
    areas_of_law = models.TextField(blank=True, null=True)
    location_preferences = models.TextField(blank=True, null=True)   # can store comma-separated
    work_preferences = models.TextField(blank=True, null=True)       # e.g. "remote, in-person"

    # match / approval status
    is_matched = models.BooleanField(default=False)
    admin_approval_needed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class Statement(BaseModel):
    """
    Student statements from CSV, with an optional numeric grade out of 25.
    """
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='statements')
    content = models.TextField()
    area_of_law = models.CharField(max_length=128, blank=True, null=True)
    statement_grade = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"Statement for {self.student_profile} in {self.area_of_law}"

class StudentGrade(BaseModel):
    """
    Grades parsed from PDF: 5 classes + LRW subgrades.
    """
    student_profile = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name='grades')

    constitutional_law = models.CharField(max_length=3, blank=True, null=True)
    contracts = models.CharField(max_length=3, blank=True, null=True)
    criminal_law = models.CharField(max_length=3, blank=True, null=True)
    property_law = models.CharField(max_length=3, blank=True, null=True)
    torts = models.CharField(max_length=3, blank=True, null=True)

    lrw_case_brief = models.CharField(max_length=5, blank=True, null=True)
    lrw_multiple_case = models.CharField(max_length=5, blank=True, null=True)
    lrw_short_memo = models.CharField(max_length=5, blank=True, null=True)

    def __str__(self):
        return f"Grades for {self.student_profile}"

class OrganizationProfile(BaseModel):
    name = models.CharField(max_length=128)
    area_of_law = models.CharField(max_length=64, blank=True, null=True)
    location = models.CharField(max_length=128, blank=True, null=True)

    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class FacultyProfile(BaseModel):
    full_name = models.CharField(max_length=100)
    department = models.CharField(max_length=128, blank=True, null=True)
    research_areas = models.TextField(blank=True, null=True)

    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return self.full_name

class MatchingRound(BaseModel):
    round_number = models.IntegerField()
    status = models.CharField(max_length=20, default='pending')
    matched_count = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)

    def __str__(self):
        return f"MatchingRound #{self.round_number} - {self.status}"