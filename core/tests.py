from datetime import date

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import AdminAuditLog, Certificate, Notification, Scholarship


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

    def test_user_certificate_filters_by_points_and_date(self):
        Certificate.objects.create(
            user=self.user,
            title="Старая",
            file="certificates/old.pdf",
            event_level="city",
            place="participant",
            event_date=date(2025, 1, 1),
            custom_points=3,
            status="approved",
        )
        Certificate.objects.create(
            user=self.user,
            title="Новая",
            file="certificates/new.pdf",
            event_level="international",
            place="winner",
            event_date=date(2026, 1, 1),
            custom_points=60,
            status="approved",
        )
        self.client.login(username="simple", password="pass12345")
        response = self.client.get(
            reverse("certificate_list"),
            {"min_points": 50, "date_from": "2025-06-01"},
        )
        self.assertEqual(response.status_code, 200)
        certificates = list(response.context["certificates"])
        self.assertEqual(len(certificates), 1)
        self.assertEqual(certificates[0].title, "Новая")

    def test_admin_certificate_filters_by_username_and_level(self):
        Certificate.objects.create(
            user=self.user,
            title="Грамота simple",
            file="certificates/simple.pdf",
            event_level="city",
            place="participant",
            event_date=date(2026, 1, 2),
            status="pending",
        )
        other_user = User.objects.create_user(username="other", password="pass12345")
        Certificate.objects.create(
            user=other_user,
            title="Грамота other",
            file="certificates/other.pdf",
            event_level="international",
            place="winner",
            event_date=date(2026, 1, 3),
            status="approved",
        )
        self.client.login(username="admin2", password="pass12345")
        response = self.client.get(
            reverse("admin_certificate_list"),
            {"username": "simp", "level": "city"},
        )
        self.assertEqual(response.status_code, 200)
        certificates = list(response.context["certificates"])
        self.assertEqual(len(certificates), 1)
        self.assertEqual(certificates[0].title, "Грамота simple")

    def test_certificate_workflow_transition(self):
        certificate = Certificate.objects.create(
            user=self.user,
            title="Процесс",
            file="certificates/workflow.pdf",
            event_level="city",
            place="participant",
            event_date=date(2026, 1, 2),
            status="pending",
        )
        self.client.login(username="admin2", password="pass12345")
        response = self.client.post(
            reverse("admin_certificate_edit", kwargs={"pk": certificate.pk}),
            {
                "title": certificate.title,
                "event_level": certificate.event_level,
                "place": certificate.place,
                "event_date": "2026-01-02",
                "status": "approved",
                "custom_points": "",
                "moderator_comment": "Проверено",
                "rejection_reason": "",
            },
        )
        self.assertEqual(response.status_code, 302)
        certificate.refresh_from_db()
        self.assertEqual(certificate.status, "approved")

    def test_notification_created_on_status_change(self):
        certificate = Certificate.objects.create(
            user=self.user,
            title="Уведомление",
            file="certificates/notify.pdf",
            event_level="city",
            place="participant",
            event_date=date(2026, 1, 2),
            status="pending",
        )
        self.client.login(username="admin2", password="pass12345")
        response = self.client.post(
            reverse("admin_certificate_edit", kwargs={"pk": certificate.pk}),
            {
                "title": certificate.title,
                "event_level": certificate.event_level,
                "place": certificate.place,
                "event_date": "2026-01-02",
                "status": "approved",
                "custom_points": "",
                "moderator_comment": "Все ок",
                "rejection_reason": "",
            },
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Notification.objects.filter(user=self.user, title__icontains="статус").exists())
        self.assertTrue(AdminAuditLog.objects.filter(action="status_changed").exists())

    def test_header_badges_context_for_admin(self):
        Certificate.objects.create(
            user=self.user,
            title="Бейдж проверки",
            file="certificates/pending.pdf",
            event_level="city",
            place="participant",
            event_date=date(2026, 1, 2),
            status="pending",
        )
        self.client.login(username="admin2", password="pass12345")
        response = self.client.get(reverse("admin_certificate_list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.context["badge_pending_certificates"], 1)

    def test_notifications_delete_read(self):
        Notification.objects.create(user=self.user, title="Непрочитано", message="M1", is_read=False)
        Notification.objects.create(user=self.user, title="Прочитано", message="M2", is_read=True)
        self.client.login(username="simple", password="pass12345")
        response = self.client.post(reverse("notifications_view"), {"action": "delete_read"})
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Notification.objects.filter(user=self.user).count(), 1)
        self.assertTrue(Notification.objects.filter(user=self.user, title="Непрочитано").exists())


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

    def test_notifications_api(self):
        Notification.objects.create(user=self.user, title="Тест", message="Сообщение")
        token = Token.objects.create(user=self.user)
        self.client_api.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = self.client_api.get(reverse("api-notifications-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
