from django.db import models
from django.conf import settings  # Import settings

class BaseModel(models.Model):
    """Abstract base model with common fields."""
    id = models.BigAutoField(primary_key=True)  # Use BigAutoField for auto-incrementing PK
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    concurrency_version = models.IntegerField(default=1)
    created_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='created_%(class)ss')
    updated_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='updated_%(class)ss')

    class Meta:
        abstract = True

class Match(BaseModel):
    """Represents a match between a student and an organization or faculty."""
    student_profile = models.ForeignKey('sail.StudentProfile', on_delete=models.CASCADE, related_name='matches')
    organization_profile = models.ForeignKey('sail.OrganizationProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='matches')
    faculty_profile = models.ForeignKey('sail.FacultyProfile', on_delete=models.SET_NULL, null=True, blank=True, related_name='matches')

    status = models.CharField(max_length=20)  # 'pending', 'accepted', 'rejected'
    match_type = models.CharField(max_length=20)  # 'algorithmic', 'manual'
    score = models.FloatField(null=True, blank=True)
    round_number = models.IntegerField(null=True, blank=True)

    accepted_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)

    ranking_score = models.FloatField(null=True, blank=True)
    grades_score = models.FloatField(null=True, blank=True)
    statement_score = models.FloatField(null=True, blank=True)
    location_score = models.FloatField(null=True, blank=True)
    work_mode_score = models.FloatField(null=True, blank=True)

    def __str__(self):
        student_name = self.student_profile.user.get_full_name() if self.student_profile and self.student_profile.user else 'Unknown Student'
        org_name = self.organization_profile.name if self.organization_profile else 'Unmatched Org'
        return f"Match between {student_name} and {org_name} (ID: {self.id}, Status: {self.status})"


class MatchHistory(BaseModel):
    """Tracks the history of match status changes."""
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='history_records')
    action = models.CharField(max_length=64)
    old_status = models.CharField(max_length=20, null=True, blank=True)
    new_status = models.CharField(max_length=20, null=True, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"History for Match ID {self.match.id}, Action: {self.action}, Status: {self.new_status}"


class MatchingRound(BaseModel):
    """Represents a complete matching algorithm run."""
    round_number = models.IntegerField(null=False)
    status = models.CharField(max_length=20, null=False)
    started_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    total_students = models.IntegerField(null=True, blank=True)
    matched_students = models.IntegerField(null=True, blank=True)
    total_organizations = models.IntegerField(null=True, blank=True)
    filled_positions = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Matching Round {self.round_number}, Status: {self.status}"


class StudentGrade(BaseModel):
    """Individual course grades for students."""
    student_profile = models.ForeignKey('sail.StudentProfile', on_delete=models.CASCADE, related_name='grades')
    course_name = models.CharField(max_length=128, null=False)
    grade = models.CharField(max_length=2, null=False)
    numeric_grade = models.FloatField(null=False)
    term = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self):
        return f"Grade for {self.student_profile.user.get_full_name()} - {self.course_name}: {self.grade}"


class Statement(BaseModel):
    """Student statements for different areas of law."""
    student_profile = models.ForeignKey('sail.StudentProfile', on_delete=models.CASCADE, related_name='statements')
    area_of_law = models.CharField(max_length=64, null=False)
    content = models.TextField(null=False)

    clarity_rating = models.IntegerField(null=True, blank=True)
    relevance_rating = models.IntegerField(null=True, blank=True)
    passion_rating = models.IntegerField(null=True, blank=True)
    understanding_rating = models.IntegerField(null=True, blank=True)
    goals_rating = models.IntegerField(null=True, blank=True)
    total_score = models.FloatField(null=True, blank=True)
    graded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_statements')
    graded_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Statement by {self.student_profile.user.get_full_name()} for {self.area_of_law}"


class StudentProfile(BaseModel):
    """Profile for students in the system."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    overall_grade = models.FloatField(null=True, blank=True)
    statement_score = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')

    resume_path = models.CharField(max_length=256, blank=True, null=True)
    cover_letter_path = models.CharField(max_length=256, blank=True, null=True)
    transcript_path = models.CharField(max_length=256, blank=True, null=True)
    learning_plan_path = models.CharField(max_length=256, blank=True, null=True)
    midpoint_checkin_path = models.CharField(max_length=256, blank=True, null=True)
    final_reflection_path = models.CharField(max_length=256, blank=True, null=True)

    learning_plan_text = models.TextField(blank=True, null=True)
    midpoint_checkin_text = models.TextField(blank=True, null=True)
    final_reflection_text = models.TextField(blank=True, null=True)

    learning_plan_approved_by_mentor = models.BooleanField(default=False)
    midpoint_approved_by_mentor = models.BooleanField(default=False)
    final_reflection_approved_by_mentor = models.BooleanField(default=False)
    deliverables_accepted_by_admin = models.BooleanField(default=False)

    def __str__(self):
        return f"Student Profile for {self.user.get_full_name()} (ID: {self.id}, Status: {self.status})"


class OrganizationProfile(BaseModel):
    """Profile for organizations that can host students."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organization_profile')
    name = models.CharField(max_length=128, nullable=False)
    area_of_law = models.CharField(max_length=64, nullable=False)
    description = models.TextField(blank=True, null=True)
    website = models.CharField(max_length=256, blank=True, null=True)
    location = models.CharField(max_length=128, nullable=False)
    work_mode = models.CharField(max_length=20, nullable=False)
    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return f"Organization Profile: {self.name} (ID: {self.id})"


class FacultyProfile(BaseModel):
    """Faculty profile for mentors/supervisors in the system."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='faculty_profile')
    department = models.CharField(max_length=128, null=False)
    research_areas = models.TextField(blank=True, null=True)
    office_location = models.CharField(max_length=128, blank=True, null=True)
    available_positions = models.IntegerField(default=1)
    filled_positions = models.IntegerField(default=0)

    def __str__(self):
        return f"Faculty Profile: {self.user.get_full_name()} (ID: {self.id})"

class AreaRanking(BaseModel): # Added AreaRanking model
    """Student ranking preferences for different areas of law."""
    student_profile = models.ForeignKey('sail.StudentProfile', on_delete=models.CASCADE, related_name='rankings') # ForeignKey to Django model, REPLACE 'your_app_name' WITH 'sail'
    area_of_law = models.CharField(max_length=64, nullable=False)
    rank = models.IntegerField(nullable=False)

    def __str__(self):
        return f"Area Ranking for {self.student_profile.user.get_full_name()} - {self.area_of_law}: Rank {self.rank}"