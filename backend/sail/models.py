"""
File: backend/sail/models.py
Purpose: Core data models for the SAIL application
Defines database schema and relationships
"""

import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField

class BaseModel(models.Model):
    """
    Abstract model with common fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class AreaOfLaw(BaseModel):
    """
    Distinct areas of law that students can rank or select
    """
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

class StudentProfile(BaseModel):
    """
    Holds data merged from CSV + PDF.
    """
    # Remove the default lambda and unique constraint temporarily
    student_id = models.CharField(max_length=50)
    first_name = models.CharField(max_length=100, default="Unknown")
    last_name = models.CharField(max_length=100, default="Student")
    email = models.EmailField(blank=True, null=True)
    backup_email = models.EmailField(blank=True, null=True)

    # Program info
    program = models.CharField(max_length=128, blank=True, null=True)
    program_chosen = models.CharField(max_length=200, blank=True, null=True)
    
    # Store as text field for backward compatibility
    areas_of_law = models.TextField(blank=True, null=True)
    
    # Store preferences as arrays
    statements_of_interest = ArrayField(
        models.TextField(blank=True),
        size=5,
        null=True,
        blank=True
    )
    
    location_preferences = ArrayField(
        models.CharField(max_length=50),
        null=True,
        blank=True
    )
    
    work_preferences = ArrayField(
        models.CharField(max_length=50),
        null=True,
        blank=True
    )
    
    # For backward compatibility, keep these as text fields
    location_preferences_text = models.TextField(blank=True, null=True)
    work_preferences_text = models.TextField(blank=True, null=True)

    is_matched = models.BooleanField(default=False)
    admin_approval_needed = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"
    
    def save(self, *args, **kwargs):
        # Convert between array and text fields to maintain compatibility
        if self.location_preferences and not self.location_preferences_text:
            self.location_preferences_text = ';'.join(self.location_preferences)
        elif self.location_preferences_text and not self.location_preferences:
            self.location_preferences = [loc.strip() for loc in self.location_preferences_text.split(';')]
        
        if self.work_preferences and not self.work_preferences_text:
            self.work_preferences_text = ';'.join(self.work_preferences)
        elif self.work_preferences_text and not self.work_preferences:
            self.work_preferences = [pref.strip() for pref in self.work_preferences_text.split(';')]
        
        super().save(*args, **kwargs)

class StudentAreaRanking(BaseModel):
    """
    Stores a student's ranking of different areas of law
    """
    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='area_rankings')
    area = models.ForeignKey(AreaOfLaw, on_delete=models.CASCADE)
    rank = models.PositiveSmallIntegerField(blank=True, null=True)
    
    class Meta:
        unique_together = ('student_profile', 'area')
        ordering = ['student_profile', 'rank']
    
    def __str__(self):
        return f"{self.student_profile} -> {self.area} (Rank {self.rank})"

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

class SelfProposedExternship(BaseModel):
    """
    Details for self-proposed externships
    """
    student_profile = models.OneToOneField(StudentProfile, on_delete=models.CASCADE, related_name='self_proposed')
    organization = models.CharField(max_length=200, blank=True, null=True)
    supervisor = models.CharField(max_length=100, blank=True, null=True)
    supervisor_email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"Self-proposed externship for {self.student_profile}"

class OrganizationProfile(BaseModel):
    name = models.CharField(max_length=128, default="Unknown Organization")
    description = models.TextField(blank=True, null=True)
    # Change from string to M2M relationship
    areas_of_law = models.ManyToManyField(AreaOfLaw, related_name='organizations')
    location = models.CharField(max_length=128, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)
    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

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

class ImportLog(BaseModel):
    """
    Log of file imports with error details
    """
    file_name = models.CharField(max_length=200)
    import_datetime = models.DateTimeField(auto_now_add=True)
    import_type = models.CharField(max_length=50, choices=[
        ('csv', 'CSV Import'),
        ('pdf', 'PDF Grades'),
    ])
    imported_by = models.CharField(max_length=150, blank=True, null=True)
    success_count = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    errors = models.TextField(blank=True, null=True)  # Stores JSON or text
    
    def __str__(self):
        return f"{self.import_type} - {self.file_name} ({self.import_datetime.strftime('%Y-%m-%d %H:%M')})"

class SystemSetting(BaseModel):
    """
    System-wide settings stored as key-value pairs with categories
    """
    CATEGORY_CHOICES = [
        ('general', 'General Settings'),
        ('students', 'Student Settings'),
        ('organizations', 'Organization Settings'),
        ('matching', 'Matching Settings'),
        ('notifications', 'Notification Settings'),
        ('security', 'Security Settings'),
        ('import_export', 'Import/Export Settings'),
        ('appearance', 'Appearance Settings'),
    ]
    
    DATA_TYPE_CHOICES = [
        ('string', 'String'),
        ('integer', 'Integer'),
        ('float', 'Float'),
        ('boolean', 'Boolean'),
        ('date', 'Date'),
        ('json', 'JSON'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True, null=True)
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES, default='string')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    description = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=False, help_text="Whether this setting can be viewed by non-admin users")
    requires_restart = models.BooleanField(default=False, help_text="Whether changes to this setting require a system restart")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'key']
    
    def __str__(self):
        return f"{self.key} ({self.category})"
    
    def get_typed_value(self):
        """Convert the string value to its proper data type"""
        if not self.value:
            return None
            
        if self.data_type == 'integer':
            return int(self.value)
        elif self.data_type == 'float':
            return float(self.value)
        elif self.data_type == 'boolean':
            return self.value.lower() in ('true', 'yes', '1')
        elif self.data_type == 'date':
            from datetime import datetime
            return datetime.strptime(self.value, '%Y-%m-%d').date()
        elif self.data_type == 'json':
            import json
            return json.loads(self.value)
        # String and other types returned as is
        return self.value

class Externship(BaseModel):
    EXTERNSHIP_TYPES = [
        ('STANDARD', 'Standard Externship'),
        ('SELF_PROPOSED', 'Self-Proposed Externship'),
    ]

    student_profile = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='externships')
    organization_profile = models.ForeignKey(OrganizationProfile, on_delete=models.CASCADE, related_name='externships')
    externship_type = models.CharField(max_length=20, choices=EXTERNSHIP_TYPES)
    supervisor_name = models.CharField(max_length=100, blank=True, null=True)
    supervisor_email = models.EmailField(blank=True, null=True)
    supervisor_phone = models.CharField(max_length=20, blank=True, null=True)
    area_of_law = models.ForeignKey(AreaOfLaw, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.student_profile} at {self.organization_profile} ({self.externship_type})"

    def save(self, *args, **kwargs):
        # If this is a self-proposed externship, sync with SelfProposedExternship
        if self.externship_type == 'SELF_PROPOSED':
            self_proposed, created = SelfProposedExternship.objects.get_or_create(
                student_profile=self.student_profile
            )
            if self.organization_profile:
                self_proposed.organization = self.organization_profile.name
            if self.supervisor_name:
                self_proposed.supervisor = self.supervisor_name
            if self.supervisor_email:
                self_proposed.supervisor_email = self.supervisor_email
            self_proposed.save()

        super().save(*args, **kwargs)
