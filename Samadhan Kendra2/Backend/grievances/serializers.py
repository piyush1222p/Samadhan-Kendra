from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Department, Grievance, Comment

User = get_user_model()


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "name"]


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "author", "author_name", "text", "created_at"]
        read_only_fields = ["id", "author", "author_name", "created_at"]


class GrievanceSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source="citizen.username", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Grievance
        fields = [
            "id",
            "title",
            "description",
            "status",
            "priority",
            "citizen",
            "citizen_name",
            "department",
            "department_name",
            "assigned_to",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "citizen", "citizen_name", "created_at", "updated_at"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )