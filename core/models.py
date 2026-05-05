from datetime import timedelta

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


EVENT_LEVEL_SCORES = {
    "city": 5,
    "region": 10,
    "national": 15,
    "international": 20,
    "university": 8,
}

PLACE_MULTIPLIER = {
    "participant": 1,
    "prize_winner": 2,
    "winner": 3,
}


class StudentProfile(models.Model):
    STUDY_FORM_CHOICES = (
        ("full_time", "Очная"),
        ("part_time", "Заочная"),
        ("mixed", "Очно-заочная"),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    record_book_number = models.CharField("Номер зачетки", max_length=30, blank=True)
    birth_date = models.DateField("Дата рождения", null=True, blank=True)
    institution = models.CharField("Институт", max_length=255, blank=True)
    specialty = models.CharField("Специальность", max_length=255, blank=True)
    course = models.PositiveSmallIntegerField("Курс", null=True, blank=True)
    study_form = models.CharField(
        "Форма обучения", max_length=20, choices=STUDY_FORM_CHOICES, blank=True
    )
    portfolio = models.FileField(
        "Портфолио", upload_to="portfolios/", null=True, blank=True
    )

    class Meta:
        verbose_name = "Профиль студента"
        verbose_name_plural = "Профили студентов"

    def __str__(self) -> str:
        return f"{self.user.get_full_name() or self.user.username}"


class Scholarship(models.Model):
    name = models.CharField("Название", max_length=255)
    description = models.TextField("Описание", blank=True)
    min_points = models.PositiveIntegerField("Минимум баллов", default=0)
    is_active = models.BooleanField("Активна", default=True)

    class Meta:
        verbose_name = "Стипендия"
        verbose_name_plural = "Стипендии"

    def __str__(self) -> str:
        return self.name


class Certificate(models.Model):
    EVENT_LEVEL_CHOICES = (
        ("city", "Городской"),
        ("region", "Областной"),
        ("national", "Всероссийский"),
        ("international", "Международный"),
        ("university", "Вузовский"),
    )
    PLACE_CHOICES = (
        ("participant", "Участник"),
        ("prize_winner", "Призер"),
        ("winner", "Победитель"),
    )
    STATUS_CHOICES = (
        ("pending", "На проверке"),
        ("approved", "Подтверждена"),
        ("rejected", "Отклонена"),
        ("archived", "В архиве"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="certificates")
    title = models.CharField("Название грамоты", max_length=255)
    file = models.FileField("Файл грамоты", upload_to="certificates/")
    event_level = models.CharField(
        "Уровень мероприятия", max_length=20, choices=EVENT_LEVEL_CHOICES
    )
    place = models.CharField("Место", max_length=20, choices=PLACE_CHOICES)
    event_date = models.DateField("Дата мероприятия")
    auto_points = models.PositiveIntegerField("Автоматические баллы", default=0)
    custom_points = models.PositiveIntegerField(
        "Ручные баллы (админ)", null=True, blank=True
    )
    extracted_text = models.TextField("Распознанный текст", blank=True)
    status = models.CharField("Статус", max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Грамота"
        verbose_name_plural = "Грамоты"
        ordering = ("-event_date", "-created_at")

    def __str__(self) -> str:
        return f"{self.title} ({self.user.username})"

    @property
    def is_expired(self) -> bool:
        return self.event_date <= (timezone.now().date() - timedelta(days=365))

    @property
    def points(self) -> int:
        return self.custom_points if self.custom_points is not None else self.auto_points

    def recalculate_points(self) -> None:
        self.auto_points = EVENT_LEVEL_SCORES[self.event_level] * PLACE_MULTIPLIER[self.place]

    def save(self, *args, **kwargs):
        self.recalculate_points()
        if self.is_expired and self.status == "approved":
            self.status = "archived"
        super().save(*args, **kwargs)


class PointAdjustment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="adjustments")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="made_adjustments"
    )
    value = models.IntegerField("Корректировка")
    reason = models.TextField("Причина")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Корректировка баллов"
        verbose_name_plural = "Корректировки баллов"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user.username}: {self.value:+d}"


class ScholarshipCalculation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="calculations")
    scholarship = models.ForeignKey(
        Scholarship, on_delete=models.CASCADE, related_name="calculations"
    )
    certificate_points = models.IntegerField("Баллы за грамоты")
    adjustment_points = models.IntegerField("Корректировка")
    total_points = models.IntegerField("Итог")
    is_eligible = models.BooleanField("Подходит")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Расчет стипендии"
        verbose_name_plural = "Расчеты стипендий"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return f"{self.user.username} -> {self.scholarship.name}: {self.total_points}"
