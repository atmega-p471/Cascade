from django.db.models import Sum

from .models import Certificate


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
