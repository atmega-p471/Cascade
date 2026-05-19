from .models import Certificate, Notification


def header_badges(request):
    if not request.user.is_authenticated:
        return {}

    unread_notifications = Notification.objects.filter(user=request.user, is_read=False).count()
    pending_certificates = 0
    if request.user.is_staff:
        pending_certificates = Certificate.objects.filter(status="pending").count()

    return {
        "badge_notifications": min(unread_notifications, 99),
        "badge_notifications_overflow": unread_notifications > 99,
        "badge_pending_certificates": min(pending_certificates, 99),
        "badge_pending_certificates_overflow": pending_certificates > 99,
    }
