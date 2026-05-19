from django.contrib import messages
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.db.models.functions import Coalesce
from django.http import HttpRequest, HttpResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from .forms import (
    AdminUserCreateForm,
    AdminUserUpdateForm,
    CertificateAdminForm,
    CertificateForm,
    PointAdjustmentForm,
    ScholarshipDeadlineForm,
    ScholarshipCalculationForm,
    StudentProfileForm,
)
from .models import Certificate, Scholarship, ScholarshipCalculation, StudentProfile
from .models import AdminAuditLog, Notification, ScholarshipDeadline
from .services import (
    log_admin_action,
    notify_user_status_change,
    sum_user_adjustments,
    sum_user_certificate_points,
    try_extract_text,
)


def is_admin(user):
    return user.is_staff


@require_http_methods(["GET", "POST"])
def logout_view(request: HttpRequest) -> HttpResponse:
    logout(request)
    return redirect("login")


@login_required
def dashboard(request):
    certificates = Certificate.objects.filter(user=request.user)
    approved_points = sum_user_certificate_points(request.user)
    adjustments = sum_user_adjustments(request.user)
    today = timezone.now().date()
    context = {
        "certificates_count": certificates.count(),
        "approved_points": approved_points,
        "total_points": approved_points + adjustments,
        "pending_count": certificates.filter(status="pending").count(),
        "expired_count": sum(1 for c in certificates if c.is_expired),
        "active_scholarships": Scholarship.objects.filter(is_active=True).count(),
    }
    return render(request, "core/dashboard.html", context)


@login_required
def profile_edit(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    if request.method == "POST":
        form = StudentProfileForm(request.POST, request.FILES, instance=profile, user=request.user)
        if form.is_valid():
            instance = form.save()
            request.user.first_name = form.cleaned_data["first_name"]
            request.user.last_name = form.cleaned_data["last_name"]
            request.user.save()
            messages.success(request, "Профиль обновлен.")
            return redirect("profile_edit")
    else:
        form = StudentProfileForm(instance=profile, user=request.user)
    return render(request, "core/profile_edit.html", {"form": form})


@login_required
def certificate_list(request):
    qs = Certificate.objects.filter(user=request.user).annotate(
        display_points=Coalesce("custom_points", "auto_points")
    )
    level = request.GET.get("level")
    place = request.GET.get("place")
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    min_points = request.GET.get("min_points")
    max_points = request.GET.get("max_points")
    sort = request.GET.get("sort", "-event_date")
    show_archived = request.GET.get("archived") == "1"

    if level:
        qs = qs.filter(event_level=level)
    if place:
        qs = qs.filter(place=place)
    if date_from:
        qs = qs.filter(event_date__gte=date_from)
    if date_to:
        qs = qs.filter(event_date__lte=date_to)
    if min_points:
        qs = qs.filter(display_points__gte=min_points)
    if max_points:
        qs = qs.filter(display_points__lte=max_points)
    if not show_archived:
        qs = qs.exclude(status="archived")

    allowed_sorting = {
        "event_date",
        "-event_date",
        "display_points",
        "-display_points",
        "created_at",
        "-created_at",
    }
    if sort not in allowed_sorting:
        sort = "-event_date"
    qs = qs.order_by(sort)

    return render(
        request,
        "core/certificate_list.html",
        {
            "certificates": qs,
            "selected_level": level or "",
            "selected_place": place or "",
            "date_from": date_from or "",
            "date_to": date_to or "",
            "min_points": min_points or "",
            "max_points": max_points or "",
            "sort": sort,
            "show_archived": show_archived,
        },
    )


@login_required
def certificate_detail(request, pk):
    certificate = get_object_or_404(Certificate, pk=pk, user=request.user)
    return render(request, "core/certificate_detail.html", {"certificate": certificate})


@login_required
def certificate_create(request):
    if request.method == "POST":
        form = CertificateForm(request.POST, request.FILES)
        if form.is_valid():
            certificate = form.save(commit=False)
            certificate.user = request.user
            certificate.save()
            certificate.extracted_text = try_extract_text(certificate.file.path)
            certificate.save(update_fields=["extracted_text", "updated_at"])
            messages.success(request, "Грамота загружена и отправлена на проверку.")
            return redirect("certificate_list")
    else:
        form = CertificateForm()
    return render(request, "core/certificate_form.html", {"form": form})


@login_required
def calculate_scholarship(request):
    result = None
    if request.method == "POST":
        form = ScholarshipCalculationForm(request.POST)
        if form.is_valid():
            scholarship = form.cleaned_data["scholarship"]
            certificate_points = sum_user_certificate_points(request.user)
            adjustment_points = sum_user_adjustments(request.user)
            total = certificate_points + adjustment_points
            eligible = total >= scholarship.min_points
            result = {
                "scholarship": scholarship,
                "certificate_points": certificate_points,
                "adjustment_points": adjustment_points,
                "total": total,
                "eligible": eligible,
            }
            ScholarshipCalculation.objects.create(
                user=request.user,
                scholarship=scholarship,
                certificate_points=certificate_points,
                adjustment_points=adjustment_points,
                total_points=total,
                is_eligible=eligible,
            )
    else:
        form = ScholarshipCalculationForm()
    return render(request, "core/calculate.html", {"form": form, "result": result})


@login_required
def files_view(request):
    profile, _ = StudentProfile.objects.get_or_create(user=request.user)
    certificates = Certificate.objects.filter(user=request.user)
    return render(
        request,
        "core/files.html",
        {"profile": profile, "certificates": certificates},
    )


@user_passes_test(is_admin)
def admin_user_list(request):
    search = request.GET.get("q", "")
    users = User.objects.all().select_related("profile")
    if search:
        users = users.filter(
            Q(username__icontains=search)
            | Q(first_name__icontains=search)
            | Q(last_name__icontains=search)
        )
    return render(request, "core/admin/user_list.html", {"users": users, "search": search})


@user_passes_test(is_admin)
def admin_user_create(request):
    if request.method == "POST":
        form = AdminUserCreateForm(request.POST)
        if form.is_valid():
            user = form.save()
            StudentProfile.objects.get_or_create(user=user)
            log_admin_action(request.user, "user_created", target_user=user, details="Создан через сайт")
            messages.success(request, "Пользователь создан.")
            return redirect("admin_user_list")
    else:
        form = AdminUserCreateForm()
    return render(request, "core/admin/user_form.html", {"form": form, "title": "Создание пользователя"})


@user_passes_test(is_admin)
def admin_user_edit(request, pk):
    user = get_object_or_404(User, pk=pk)
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    if request.method == "POST":
        user_form = AdminUserUpdateForm(request.POST, instance=user)
        profile_form = StudentProfileForm(request.POST, request.FILES, instance=profile, user=user)
        if user_form.is_valid() and profile_form.is_valid():
            user_form.save()
            profile_form.save()
            log_admin_action(request.user, "user_updated", target_user=user, details="Редактирование профиля")
            messages.success(request, "Пользователь обновлен.")
            return redirect("admin_user_list")
    else:
        user_form = AdminUserUpdateForm(instance=user)
        profile_form = StudentProfileForm(instance=profile, user=user)
    return render(
        request,
        "core/admin/user_edit.html",
        {"user_form": user_form, "profile_form": profile_form, "target_user": user},
    )


@user_passes_test(is_admin)
def admin_user_delete(request, pk):
    user = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        username = user.username
        actor = request.user
        user.delete()
        log_admin_action(actor, "user_deleted", details=f"Удален пользователь {username}")
        messages.success(request, "Пользователь удален.")
        return redirect("admin_user_list")
    return render(request, "core/admin/confirm_delete.html", {"target_user": user})


@user_passes_test(is_admin)
def admin_certificate_list(request):
    certificates = Certificate.objects.select_related("user").annotate(
        display_points=Coalesce("custom_points", "auto_points")
    )
    username = request.GET.get("username", "")
    level = request.GET.get("level", "")
    place = request.GET.get("place", "")
    status = request.GET.get("status", "")
    date_from = request.GET.get("date_from")
    date_to = request.GET.get("date_to")
    min_points = request.GET.get("min_points")
    max_points = request.GET.get("max_points")
    sort = request.GET.get("sort", "-event_date")

    if username:
        certificates = certificates.filter(user__username__icontains=username)
    if level:
        certificates = certificates.filter(event_level=level)
    if place:
        certificates = certificates.filter(place=place)
    if status:
        certificates = certificates.filter(status=status)
    if date_from:
        certificates = certificates.filter(event_date__gte=date_from)
    if date_to:
        certificates = certificates.filter(event_date__lte=date_to)
    if min_points:
        certificates = certificates.filter(display_points__gte=min_points)
    if max_points:
        certificates = certificates.filter(display_points__lte=max_points)

    allowed_sorting = {
        "event_date",
        "-event_date",
        "display_points",
        "-display_points",
        "created_at",
        "-created_at",
    }
    if sort not in allowed_sorting:
        sort = "-event_date"
    certificates = certificates.order_by(sort)

    return render(
        request,
        "core/admin/certificate_list.html",
        {
            "certificates": certificates,
            "username": username,
            "selected_level": level,
            "selected_place": place,
            "selected_status": status,
            "date_from": date_from or "",
            "date_to": date_to or "",
            "min_points": min_points or "",
            "max_points": max_points or "",
            "sort": sort,
        },
    )


@user_passes_test(is_admin)
def admin_certificate_edit(request, pk):
    certificate = get_object_or_404(Certificate, pk=pk)
    if request.method == "POST":
        old_status = certificate.status
        form = CertificateAdminForm(request.POST, instance=certificate)
        if form.is_valid():
            updated = form.save(commit=False)
            if old_status != updated.status:
                updated.reviewed_by = request.user
                updated.reviewed_at = timezone.now()
            updated.save()
            if old_status != updated.status:
                log_admin_action(
                    request.user,
                    "status_changed",
                    target_user=updated.user,
                    certificate=updated,
                    details=f"{old_status} -> {updated.status}",
                )
                notify_user_status_change(
                    updated, dict(Certificate.STATUS_CHOICES).get(old_status, old_status), updated.get_status_display()
                )
            log_admin_action(
                request.user,
                "certificate_updated",
                target_user=updated.user,
                certificate=updated,
                details="Обновление данных грамоты",
            )
            messages.success(request, "Грамота обновлена.")
            return redirect("admin_certificate_list")
    else:
        form = CertificateAdminForm(instance=certificate)
    return render(
        request,
        "core/admin/certificate_form.html",
        {"form": form, "certificate": certificate},
    )


@user_passes_test(is_admin)
def admin_certificate_delete(request, pk):
    certificate = get_object_or_404(Certificate, pk=pk)
    if request.method == "POST":
        owner = certificate.user
        title = certificate.title
        log_admin_action(
            request.user,
            "certificate_deleted",
            target_user=owner,
            certificate=certificate,
            details=f"Удалена грамота {title}",
        )
        certificate.delete()
        messages.success(request, "Грамота удалена.")
        return redirect("admin_certificate_list")
    return render(
        request,
        "core/admin/certificate_delete.html",
        {"certificate": certificate},
    )


@user_passes_test(is_admin)
def admin_adjust_points(request, pk):
    target_user = get_object_or_404(User, pk=pk)
    if request.method == "POST":
        form = PointAdjustmentForm(request.POST)
        if form.is_valid():
            adjustment = form.save(commit=False)
            adjustment.user = target_user
            adjustment.created_by = request.user
            adjustment.save()
            log_admin_action(
                request.user,
                "points_adjusted",
                target_user=target_user,
                details=f"Корректировка {adjustment.value:+d}. Причина: {adjustment.reason}",
            )
            messages.success(request, "Корректировка сохранена.")
            return redirect("admin_user_edit", pk=target_user.pk)
    else:
        form = PointAdjustmentForm()
    return render(request, "core/admin/adjust_points.html", {"form": form, "target_user": target_user})


@user_passes_test(is_admin)
def admin_statistics(request):
    by_level = (
        Certificate.objects.values("event_level")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    by_place = Certificate.objects.values("place").annotate(total=Count("id")).order_by("-total")
    top_scholarships = (
        ScholarshipCalculation.objects.values("scholarship__name")
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    by_user = (
        Certificate.objects.values("user__username")
        .annotate(total=Count("id"))
        .order_by("-total")[:10]
    )
    return render(
        request,
        "core/admin/statistics.html",
        {
            "by_level": by_level,
            "by_place": by_place,
            "top_scholarships": top_scholarships,
            "by_user": by_user,
            "audit_logs": AdminAuditLog.objects.select_related("actor", "target_user", "certificate")[:30],
            "deadlines": ScholarshipDeadline.objects.select_related("scholarship").order_by("end_date")[:20],
        },
    )


@login_required
def notifications_view(request):
    notifications = Notification.objects.filter(user=request.user)
    if request.method == "POST":
        action = request.POST.get("action")
        if action == "mark_read":
            notifications.filter(is_read=False).update(is_read=True)
            messages.success(request, "Уведомления отмечены как прочитанные.")
        elif action == "delete_read":
            deleted_count, _ = notifications.filter(is_read=True).delete()
            messages.success(request, f"Удалено прочитанных уведомлений: {deleted_count}.")
        return redirect("notifications_view")
    return render(request, "core/notifications.html", {"notifications": notifications})


@user_passes_test(is_admin)
def export_reports_excel(request):
    wb = Workbook()
    ws = wb.active
    ws.title = "Грамоты"
    ws.append(["Пользователь", "Название", "Уровень", "Место", "Дата", "Статус", "Баллы"])
    qs = Certificate.objects.select_related("user").order_by("-event_date")
    for c in qs:
        ws.append(
            [
                c.user.username,
                c.title,
                c.get_event_level_display(),
                c.get_place_display(),
                c.event_date.isoformat(),
                c.get_status_display(),
                c.points,
            ]
        )
    response = HttpResponse(
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    response["Content-Disposition"] = 'attachment; filename="cascade-отчет.xlsx"'
    wb.save(response)
    log_admin_action(request.user, "report_exported", details="Отчет Эксель")
    return response


@user_passes_test(is_admin)
def export_reports_pdf(request):
    response = HttpResponse(content_type="application/pdf")
    response["Content-Disposition"] = 'attachment; filename="cascade-отчет.pdf"'
    p = canvas.Canvas(response, pagesize=A4)
    font_path = "C:/Windows/Fonts/arial.ttf"
    pdfmetrics.registerFont(TTFont("ArialUnicode", font_path))
    p.setFont("ArialUnicode", 12)
    y = 800
    p.drawString(40, y, "Cascade отчет: грамоты")
    y -= 20
    for c in Certificate.objects.select_related("user").order_by("-event_date")[:80]:
        line = f"{c.user.username} | {c.title[:35]} | {c.get_status_display()} | {c.points}"
        p.drawString(40, y, line)
        y -= 14
        if y < 60:
            p.showPage()
            y = 800
    p.save()
    log_admin_action(request.user, "report_exported", details="Отчет ПДФ")
    return response


@user_passes_test(is_admin)
def admin_audit_logs(request):
    logs = AdminAuditLog.objects.select_related("actor", "target_user", "certificate")[:200]
    return render(request, "core/admin/audit_logs.html", {"audit_logs": logs})


@user_passes_test(is_admin)
def admin_deadlines(request):
    if request.method == "POST":
        form = ScholarshipDeadlineForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Дедлайн сохранен.")
            return redirect("admin_deadlines")
    else:
        form = ScholarshipDeadlineForm()
    deadlines = ScholarshipDeadline.objects.select_related("scholarship").order_by("end_date")
    return render(
        request,
        "core/admin/deadlines.html",
        {
            "form": form,
            "deadlines": deadlines,
            "today": timezone.now().date(),
        },
    )
