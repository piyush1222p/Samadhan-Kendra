from django.http import JsonResponse
from django.utils import timezone

def home(request):
    return JsonResponse({
        "app": "grievances",
        "message": "welcome",
        "time": timezone.now().isoformat(),
    })

def health(request):
    return JsonResponse({
        "ok": True,
        "service": "grievances",
        "time": timezone.now().isoformat(),
    })