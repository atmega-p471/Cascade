from django.contrib import admin

from .models import Certificate, PointAdjustment, Scholarship, ScholarshipCalculation, StudentProfile


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
    list_display = ("title", "user", "event_level", "place", "status", "event_date", "auto_points")
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
