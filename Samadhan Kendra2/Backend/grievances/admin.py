from django.contrib import admin
from .models import Department, Grievance, Comment

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(Grievance)
class GrievanceAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "status", "priority", "citizen", "department", "created_at")
    list_filter = ("status", "priority", "department")
    search_fields = ("title", "description")

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "grievance", "author", "created_at")
    search_fields = ("text",)