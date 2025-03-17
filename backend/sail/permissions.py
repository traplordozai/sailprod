"""
backend/sail/permissions.py
----------------------------------
Granular permissions for DRF endpoints.
"""

from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allows safe (GET) requests for anyone; only admin can write.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)