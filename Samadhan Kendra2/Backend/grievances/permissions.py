from rest_framework.permissions import BasePermission

class IsOwnerOrStaff(BasePermission):
    """
    - Staff can do anything
    - Non-staff: can only access their own objects
    """

    def has_object_permission(self, request, view, obj):
        if request.user and request.user.is_staff:
            return True
        owner = getattr(obj, "citizen", None)
        return owner == request.user