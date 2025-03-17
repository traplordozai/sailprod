"""
backend/sail/models.py
-----------------------------
Core models for Student, Organization, Matching, etc.
"""

import uuid
from django.db import models

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
    # Remove the default lambda and unique constraint temporarily
    student_id = models.CharField(max_length=50)
    first_name = models.CharField(max_length=100, default="Unknown")
    last_name = models.CharField(max_length=100, default="Student")
    email = models.EmailField(blank=True, null=True)

    program = models.CharField(max_length=128, blank=True, null=True)
    areas_of_law = models.TextField(blank=True, null=True)
    location_preferences = models.TextField(blank=True, null=True)
    work_preferences = models.TextField(blank=True, null=True)

    is_matched = models.BooleanField(default=False)
    admin_approval_needed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class Statement(BaseModel):
    """
    Student statements from CSV, with an optional numeric grade out of 25.
    """
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='statements')
    content = models.TextField(default="")
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
    name = models.CharField(max_length=128, default="Unknown Organization")
    area_of_law = models.CharField(max_length=64, blank=True, null=True)
    location = models.CharField(max_length=128, blank=True, null=True)
    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class FacultyProfile(BaseModel):
    full_name = models.CharField(max_length=100, default="Unknown Faculty")
    department = models.CharField(max_length=128, blank=True, null=True)
    research_areas = models.TextField(blank=True, null=True)
    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return self.full_name

class MatchingRound(BaseModel):
    round_number = models.IntegerField(default=1)
    status = models.CharField(max_length=20, default='pending')
    matched_count = models.IntegerField(default=0)
    total_students = models.IntegerField(default=0)

    def __str__(self):
        return f"MatchingRound #{self.round_number} - {self.status}"
