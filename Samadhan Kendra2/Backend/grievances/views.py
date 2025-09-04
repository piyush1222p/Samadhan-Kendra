from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Department, Grievance, Comment
from .serializers import (
    DepartmentSerializer,
    GrievanceSerializer,
    CommentSerializer,
    RegisterSerializer,
)
from .permissions import IsOwnerOrStaff

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Return the serialized user to avoid editor type warnings on attributes
        return Response(RegisterSerializer(user).data, status=status.HTTP_201_CREATED)


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Department.objects.all().order_by("name")
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class GrievanceViewSet(viewsets.ModelViewSet):
    # Provide a queryset so the router can infer basename if you forget to pass it
    queryset = Grievance.objects.all()
    serializer_class = GrievanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self) -> QuerySet[Grievance]:
        qs: QuerySet[Grievance] = Grievance.objects.select_related(
            "citizen", "department", "assigned_to"
        )
        user = self.request.user
        # django-stubs may type user as AnonymousUser | AbstractBaseUser.
        # Use getattr to avoid type-checker complaints about is_staff.
        if user.is_authenticated and getattr(user, "is_staff", False):
            return qs
        return qs.filter(citizen=user)

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)

    @action(detail=True, methods=["post"])
    def comment(self, request, pk=None):
        grievance = self.get_object()
        text = (request.data.get("text") or "").strip()
        if not text:
            return Response({"detail": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(grievance=grievance, author=request.user, text=text)
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def set_status(self, request, pk=None):
        grievance = self.get_object()
        status_value = request.data.get("status")
        if status_value not in dict(Grievance.Status.choices):
            return Response({"detail": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        grievance.status = status_value
        grievance.save(update_fields=["status", "updated_at"])
        return Response(GrievanceSerializer(grievance).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def assign(self, request, pk=None):
        grievance = self.get_object()
        user_id = request.data.get("user_id")
        if not user_id:
            return Response({"detail": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            assignee = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        grievance.assigned_to = assignee
        grievance.save(update_fields=["assigned_to", "updated_at"])
        return Response(GrievanceSerializer(grievance).data)