from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import Scholarship


class Command(BaseCommand):
    help = "Создает демо-стипендии и администратора"

    def handle(self, *args, **options):
        scholarships = [
            ("ПГАС (научная)", 60, "Для активных студентов научного направления."),
            ("ПГАС (общественная)", 45, "Для социальной, волонтерской и общественной активности."),
            ("ПГАС (спортивная)", 50, "Для студентов с достижениями в спорте."),
        ]
        for name, min_points, description in scholarships:
            Scholarship.objects.get_or_create(
                name=name, defaults={"min_points": min_points, "description": description}
            )

        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                password="admin12345",
                email="admin@example.com",
                first_name="Системный",
                last_name="Администратор",
            )
            self.stdout.write(self.style.SUCCESS("Создан админ: admin / admin12345"))
        else:
            self.stdout.write(self.style.WARNING("Админ admin уже существует."))

        self.stdout.write(self.style.SUCCESS("Демо-данные готовы."))
