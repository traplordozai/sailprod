from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

class Student(models.Model):
    # Add the AREAS_OF_LAW choices
    AREAS_OF_LAW = [
        ('SJHR', 'Social Justice and Human Rights Law'),
        ('PIL', 'Public Interest Law'),
        ('PCL', 'Private/Civil Law'),
        ('IL', 'International Law'),
        ('EL', 'Environmental Law'),
        ('LL', 'Labour Law'),
        ('FL', 'Family Law'),
        ('BL', 'Business Law'),
        ('IP', 'Intellectual Property'),
    ]

    # Basic Information
    given_names = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    student_id = models.CharField(max_length=50, unique=True)
    
    # Program and Preferences
    program = models.CharField(max_length=255)
    location_preferences = models.JSONField(default=list)  # List of preferred locations
    work_preferences = models.JSONField(default=list)  # List of work preferences (in-person, hybrid, remote)
    areas_of_interest = models.JSONField(default=list)  # List of areas of interest
    area_rankings = models.JSONField(default=dict)  # Dictionary of area rankings
    
    # Self-proposed externship fields
    is_self_proposed = models.BooleanField(default=False)
    self_proposed_org = models.CharField(max_length=255, null=True, blank=True)
    self_proposed_area = models.CharField(max_length=100, null=True, blank=True)
    self_proposed_supervisor = models.CharField(max_length=255, null=True, blank=True)
    
    # Status fields
    is_matched = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    needs_approval = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.given_names} {self.last_name} ({self.student_id})"

    def save(self, *args, **kwargs):
        if not self.pk:  # Only on creation
            self.last_active = timezone.now()
        super().save(*args, **kwargs)

    @property
    def full_name(self):
        return f"{self.given_names} {self.last_name}"

    @property
    def profile_completion(self):
        required_fields = [
            self.given_names,
            self.last_name,
            self.email,
            self.student_id,
            self.program,
            self.areas_of_interest,
        ]
        completed = sum(1 for field in required_fields if field)
        return (completed / len(required_fields)) * 100

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    
    # Course Grades
    constitutional_law = models.CharField(max_length=2, blank=True, null=True)
    contracts = models.CharField(max_length=2, blank=True, null=True)
    criminal_law = models.CharField(max_length=2, blank=True, null=True)
    property_law = models.CharField(max_length=2, blank=True, null=True)
    torts = models.CharField(max_length=2, blank=True, null=True)
    
    # LRW Grades
    case_brief = models.CharField(max_length=2, blank=True, null=True)
    multiple_case_analysis = models.CharField(max_length=2, blank=True, null=True)
    short_legal_memo = models.CharField(max_length=2, blank=True, null=True)
    
    # Metadata
    grade_pdf = models.FileField(upload_to='grades/', blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def clean(self):
        valid_grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-']
        for field in self._meta.fields:
            if isinstance(field, models.CharField) and field.name != 'grade_pdf':
                value = getattr(self, field.name)
                if value and value not in valid_grades:
                    raise ValidationError(f'{field.name} must be one of {valid_grades}')

class Statement(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='statements')
    area_of_law = models.CharField(max_length=50, choices=Student.AREAS_OF_LAW)
    content = models.TextField()
    grade = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(25)],
        null=True,
        blank=True
    )
    graded_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['student', 'area_of_law']

class Organization(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    areas_of_law = models.JSONField(default=list)  # List of areas they work in
    location = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True, null=True)
    requirements = models.TextField(blank=True, null=True)
    available_positions = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Match(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='matches')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='matches')
    area_of_law = models.CharField(max_length=50, choices=Student.AREAS_OF_LAW)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    match_score = models.FloatField(null=True, blank=True)  # For storing algorithm match score
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['student', 'organization', 'area_of_law']
    
    def __str__(self):
        return f"{self.student} - {self.organization} ({self.area_of_law})"
    
    def approve(self, user):
        self.status = 'APPROVED'
        self.approved_by = user
        self.approved_at = timezone.now()
        self.save()
    
    def reject(self):
        self.status = 'REJECTED'
        self.save() 