from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Certificate, Scholarship


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


class ApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="api_user", password="pass12345")
        self.admin = User.objects.create_user(
            username="api_admin",
            password="pass12345",
            is_staff=True,
        )
        self.scholarship = Scholarship.objects.create(
            name="ПГАС API",
            min_points=10,
            is_active=True,
        )
        self.client_api = APIClient()

    def test_token_auth_and_me_endpoint(self):
        response = self.client.post(
            reverse("api-token"),
            {"username": "api_user", "password": "pass12345"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data["token"]
        self.client_api.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        me_response = self.client_api.get(reverse("api-me"))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["username"], "api_user")

    def test_user_certificate_create_and_list(self):
        token = Token.objects.create(user=self.user)
        self.client_api.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client_api.post(
            reverse("api-certificates-list"),
            {
                "title": "Олимпиада",
                "event_level": "city",
                "place": "winner",
                "event_date": "2026-01-10",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # file is required for creation

        self.assertEqual(
            self.client_api.get(reverse("api-certificates-list")).status_code,
            status.HTTP_200_OK,
        )

    def test_admin_statistics_api_access(self):
        Certificate.objects.create(
            user=self.user,
            title="Тест грамота",
            file="certificates/test.pdf",
            event_level="city",
            place="participant",
            event_date=date(2026, 1, 1),
            status="approved",
        )
        token = Token.objects.create(user=self.admin)
        self.client_api.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client_api.get(reverse("api-admin-statistics"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("by_level", response.data)
