from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

from .models import Scholarship


class AuthFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="student", password="pass12345")

    def test_login_required_dashboard(self):
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_logout_supports_get(self):
        self.client.login(username="student", password="pass12345")
        response = self.client.get(reverse("logout"))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.url, reverse("login"))
        protected = self.client.get(reverse("dashboard"))
        self.assertEqual(protected.status_code, 302)


class ScholarshipCalculationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="student2", password="pass12345")
        self.scholarship = Scholarship.objects.create(
            name="ПГАС тест",
            min_points=10,
            is_active=True,
        )

    def test_calculation_page_available(self):
        self.client.login(username="student2", password="pass12345")
        response = self.client.get(reverse("calculate_scholarship"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Расчет стипендии")


class AdminAccessTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin2",
            password="pass12345",
            is_staff=True,
        )
        self.user = User.objects.create_user(username="simple", password="pass12345")

    def test_admin_statistics_forbidden_for_user(self):
        self.client.login(username="simple", password="pass12345")
        response = self.client.get(reverse("admin_statistics"))
        self.assertEqual(response.status_code, 302)

    def test_admin_statistics_allowed_for_admin(self):
        self.client.login(username="admin2", password="pass12345")
        response = self.client.get(reverse("admin_statistics"))
        self.assertEqual(response.status_code, 200)
