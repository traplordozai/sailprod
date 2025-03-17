"""
django_project/sail/middleware.py
---------------------------------
Custom security/header middleware and other middlewares.
"""

from django.utils.deprecation import MiddlewareMixin

class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Example middleware to add extra security headers.
    Adjust or remove based on your production needs.
    """
    def process_response(self, request, response):
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        return response