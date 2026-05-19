from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    AdminAuditLog,
    Certificate,
    Notification,
    PointAdjustment,
    Scholarship,
    ScholarshipCalculation,
    ScholarshipDeadline,
    StudentProfile,
)
from .services import sum_user_adjustments, sum_user_certificate_points


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "email", "is_staff")


class StudentProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "record_book_number",
            "birth_date",
            "institution",
            "specialty",
            "course",
            "study_form",
            "portfolio",
        )

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        return super().update(instance, validated_data)


class CertificateSerializer(serializers.ModelSerializer):
    points = serializers.IntegerField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    user = UserBriefSerializer(read_only=True)
    reviewed_by = UserBriefSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = (
            "id",
            "user",
            "title",
            "file",
            "event_level",
            "place",
            "event_date",
            "auto_points",
            "custom_points",
            "points",
            "status",
            "moderator_comment",
            "rejection_reason",
            "reviewed_by",
            "reviewed_at",
            "is_expired",
            "extracted_text",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "auto_points",
            "points",
            "is_expired",
            "extracted_text",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        )


class ScholarshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scholarship
        fields = ("id", "name", "description", "min_points", "is_active")


class ScholarshipCalculationSerializer(serializers.ModelSerializer):
    scholarship = ScholarshipSerializer(read_only=True)
    scholarship_id = serializers.PrimaryKeyRelatedField(
        source="scholarship",
        queryset=Scholarship.objects.filter(is_active=True),
        write_only=True,
    )

    class Meta:
        model = ScholarshipCalculation
        fields = (
            "id",
            "scholarship",
            "scholarship_id",
            "certificate_points",
            "adjustment_points",
            "total_points",
            "is_eligible",
            "created_at",
        )
        read_only_fields = (
            "certificate_points",
            "adjustment_points",
            "total_points",
            "is_eligible",
            "created_at",
        )

    def create(self, validated_data):
        user = self.context["request"].user
        scholarship = validated_data["scholarship"]
        certificate_points = sum_user_certificate_points(user)
        adjustment_points = sum_user_adjustments(user)
        total = certificate_points + adjustment_points
        return ScholarshipCalculation.objects.create(
            user=user,
            scholarship=scholarship,
            certificate_points=certificate_points,
            adjustment_points=adjustment_points,
            total_points=total,
            is_eligible=total >= scholarship.min_points,
        )


class PointAdjustmentSerializer(serializers.ModelSerializer):
    created_by = UserBriefSerializer(read_only=True)
    user = UserBriefSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source="user", queryset=User.objects.all(), write_only=True)

    class Meta:
        model = PointAdjustment
        fields = ("id", "user", "user_id", "created_by", "value", "reason", "created_at")
        read_only_fields = ("created_at",)


class AdminUserSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "is_staff",
            "is_active",
            "profile",
        )

    def create(self, validated_data):
        password = validated_data.pop("password", None) or "change-me-12345"
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        StudentProfile.objects.get_or_create(user=user)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "message", "is_read", "created_at")
        read_only_fields = ("created_at",)


class AdminAuditLogSerializer(serializers.ModelSerializer):
    actor = UserBriefSerializer(read_only=True)
    target_user = UserBriefSerializer(read_only=True)
    certificate = CertificateSerializer(read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = ("id", "actor", "action", "target_user", "certificate", "details", "created_at")


class ScholarshipDeadlineSerializer(serializers.ModelSerializer):
    scholarship = ScholarshipSerializer(read_only=True)
    scholarship_id = serializers.PrimaryKeyRelatedField(
        source="scholarship",
        queryset=Scholarship.objects.all(),
        write_only=True,
    )

    class Meta:
        model = ScholarshipDeadline
        fields = ("id", "scholarship", "scholarship_id", "start_date", "end_date", "note")
