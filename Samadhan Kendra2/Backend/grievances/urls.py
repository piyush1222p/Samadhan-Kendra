from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, GrievanceViewSet, RegisterView

router = DefaultRouter()
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"grievances", GrievanceViewSet, basename="grievance")  # basename required

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("", include(router.urls)),
]