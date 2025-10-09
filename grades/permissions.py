from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow safe (read-only) methods for everyone; only staff/admin users may create/update/delete.
    Uses getattr(...) to avoid AttributeError when request.user is AnonymousUser.
    """

    def has_permission(self, request, view):
        # Allow GET/HEAD/OPTIONS for everyone
        if request.method in permissions.SAFE_METHODS:
            return True

        # For non-safe methods require an authenticated user who is staff or has is_admin flag.
        user = request.user
        # Make sure user is authenticated and check attributes safely
        return bool(user and user.is_authenticated and (user.is_staff or getattr(user, "is_admin", False)))


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission for Enrollment objects:
    - Safe methods: allowed for owner (student) or admin/staff
    - Write methods: allowed for owner (student) or admin/staff
    """

    def has_object_permission(self, request, view, obj):
        # Ensure request has an authenticated user
        user = request.user
        if not user or not user.is_authenticated:
            return False

        is_admin_or_staff = user.is_staff or getattr(user, "is_admin", False)
        is_owner = getattr(obj, "student", None) == user

        if request.method in permissions.SAFE_METHODS:
            return is_admin_or_staff or is_owner

        # For unsafe methods allow owner or admin/staff
        return is_admin_or_staff or is_owner