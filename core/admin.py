from django.contrib import admin

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


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "institution", "specialty", "course", "study_form")
    search_fields = ("user__username", "user__first_name", "user__last_name", "specialty")


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ("name", "min_points", "is_active")
    search_fields = ("name",)
    list_filter = ("is_active",)


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "user",
        "event_level",
        "place",
        "status",
        "event_date",
        "auto_points",
        "reviewed_by",
        "reviewed_at",
    )
    list_filter = ("event_level", "place", "status")
    search_fields = ("title", "user__username")


@admin.register(PointAdjustment)
class PointAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("user", "value", "created_by", "created_at")
    search_fields = ("user__username", "reason")


@admin.register(ScholarshipCalculation)
class ScholarshipCalculationAdmin(admin.ModelAdmin):
    list_display = ("user", "scholarship", "total_points", "is_eligible", "created_at")
    list_filter = ("is_eligible", "scholarship")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("user__username", "title", "message")


@admin.register(AdminAuditLog)
class AdminAuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "target_user", "certificate")
    list_filter = ("action",)
    search_fields = ("actor__username", "target_user__username", "details")


@admin.register(ScholarshipDeadline)
class ScholarshipDeadlineAdmin(admin.ModelAdmin):
    list_display = ("scholarship", "start_date", "end_date")
    list_filter = ("scholarship",)
