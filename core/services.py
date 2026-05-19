from django.db.models import Sum
from django.utils import timezone
from django.core.mail import send_mail

from .models import AdminAuditLog, Certificate, Notification


def try_extract_text(file_path: str) -> str:
    """
    OCR best-effort: returns empty string if dependencies are unavailable.
    """
    try:
        import pytesseract
        from PIL import Image

        image = Image.open(file_path)
        return pytesseract.image_to_string(image, lang="rus+eng")[:5000]
    except Exception:
        return ""


def sum_user_certificate_points(user) -> int:
    qs = Certificate.objects.filter(user=user, status="approved").exclude(status="archived")
    total = sum(c.points for c in qs)
    return int(total)


def sum_user_adjustments(user) -> int:
    total = user.adjustments.aggregate(total=Sum("value"))["total"] or 0
    return int(total)


def log_admin_action(actor, action: str, target_user=None, certificate=None, details: str = "") -> None:
    AdminAuditLog.objects.create(
        actor=actor,
        action=action,
        target_user=target_user,
        certificate=certificate,
        details=details,
    )


def notify_user_status_change(certificate, old_status: str, new_status: str) -> None:
    title = "Изменен статус грамоты"
    message = f'Грамота: "{certificate.title}"\nБыло: {old_status}\nСтало: {new_status}'
    if certificate.rejection_reason:
        message += f"\nПричина отклонения:\n{certificate.rejection_reason}"
    if certificate.moderator_comment:
        message += f"\nКомментарий модератора:\n{certificate.moderator_comment}"

    Notification.objects.create(user=certificate.user, title=title, message=message)

    if certificate.user.email:
        send_mail(
            subject=title,
            message=message,
            from_email=None,
            recipient_list=[certificate.user.email],
            fail_silently=True,
        )
