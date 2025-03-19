

"""
File: backend/admin_portal/admin.py
Purpose: Django admin configurations for the admin portal
"""

from django.contrib import admin
from django.utils.html import format_html
from django.urls import path
from django.shortcuts import redirect
from django.contrib import messages
from .models import Student, Grade, Statement, Organization, Match
from .utils import process_csv_file, process_pdf_file

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'given_names', 'email', 'student_id', 'program', 'is_active')
    list_filter = ('program', 'is_active', 'areas_of_interest')
    search_fields = ('last_name', 'given_names', 'email', 'student_id')
    readonly_fields = ('created_at', 'updated_at')
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-csv/', self.admin_site.admin_view(self.import_csv), name='student-import-csv'),
        ]
        return custom_urls + urls
    
    def import_csv(self, request):
        if request.method == 'POST':
            csv_file = request.FILES.get('csv_file')
            if csv_file:
                try:
                    process_csv_file(csv_file)
                    self.message_user(request, 'Successfully imported students from CSV')
                except Exception as e:
                    self.message_user(request, f'Error importing CSV: {str(e)}', level=messages.ERROR)
            return redirect('..')
        return redirect('..')

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'uploaded_at')
    list_filter = ('uploaded_at',)
    search_fields = ('student__last_name', 'student__given_names', 'student__student_id')
    readonly_fields = ('uploaded_at',)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-pdf/', self.admin_site.admin_view(self.import_pdf), name='grade-import-pdf'),
        ]
        return custom_urls + urls
    
    def import_pdf(self, request):
        if request.method == 'POST':
            pdf_file = request.FILES.get('pdf_file')
            if pdf_file:
                try:
                    process_pdf_file(pdf_file)
                    self.message_user(request, 'Successfully imported grades from PDF')
                except Exception as e:
                    self.message_user(request, f'Error importing PDF: {str(e)}', level=messages.ERROR)
            return redirect('..')
        return redirect('..')

@admin.register(Statement)
class StatementAdmin(admin.ModelAdmin):
    list_display = ('student', 'area_of_law', 'grade', 'graded_by', 'graded_at')
    list_filter = ('area_of_law', 'graded_at', 'graded_by')
    search_fields = ('student__last_name', 'student__given_names', 'content')
    readonly_fields = ('created_at',)

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'available_positions', 'is_active')
    list_filter = ('is_active', 'areas_of_law')
    search_fields = ('name', 'description', 'location')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('student', 'organization', 'area_of_law', 'status', 'match_score', 'created_at')
    list_filter = ('status', 'area_of_law', 'created_at', 'approved_by')
    search_fields = ('student__last_name', 'organization__name', 'notes')
    readonly_fields = ('created_at', 'updated_at', 'approved_at')
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('run-matching/', self.admin_site.admin_view(self.run_matching), name='run-matching'),
            path('reset-matches/', self.admin_site.admin_view(self.reset_matches), name='reset-matches'),
        ]
        return custom_urls + urls
    
    def run_matching(self, request):
        if request.method == 'POST':
            try:
                # TODO: Implement matching algorithm
                self.message_user(request, 'Successfully ran matching algorithm')
            except Exception as e:
                self.message_user(request, f'Error running matching: {str(e)}', level=messages.ERROR)
            return redirect('..')
        return redirect('..')
    
    def reset_matches(self, request):
        if request.method == 'POST':
            try:
                Match.objects.all().delete()
                self.message_user(request, 'Successfully reset all matches')
            except Exception as e:
                self.message_user(request, f'Error resetting matches: {str(e)}', level=messages.ERROR)
            return redirect('..')
        return redirect('..') 
