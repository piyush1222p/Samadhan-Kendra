from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.utils import timezone

def ping(request):
    return JsonResponse({"ok": True, "service": "django-backend", "time": timezone.now().isoformat()})

urlpatterns = [
    path("admin/", admin.site.urls),
    path("ping/", ping),        # direct access works
    path("api/ping/", ping),    # frontend can call this
    # path("", include("grievances.urls")),    # uncomment when ready
    # path("api/", include("grievances.urls")) # if your app exposes API routes
]