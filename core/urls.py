from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("login/", auth_views.LoginView.as_view(template_name="core/login.html"), name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("profile/", views.profile_edit, name="profile_edit"),
    path("certificates/", views.certificate_list, name="certificate_list"),
    path("certificates/new/", views.certificate_create, name="certificate_create"),
    path("certificates/<int:pk>/", views.certificate_detail, name="certificate_detail"),
    path("calculate/", views.calculate_scholarship, name="calculate_scholarship"),
    path("files/", views.files_view, name="files_view"),
    path("notifications/", views.notifications_view, name="notifications_view"),
    path("management/users/", views.admin_user_list, name="admin_user_list"),
    path("management/users/create/", views.admin_user_create, name="admin_user_create"),
    path("management/users/<int:pk>/edit/", views.admin_user_edit, name="admin_user_edit"),
    path("management/users/<int:pk>/delete/", views.admin_user_delete, name="admin_user_delete"),
    path("management/users/<int:pk>/adjust/", views.admin_adjust_points, name="admin_adjust_points"),
    path("management/certificates/", views.admin_certificate_list, name="admin_certificate_list"),
    path(
        "management/certificates/<int:pk>/edit/",
        views.admin_certificate_edit,
        name="admin_certificate_edit",
    ),
    path(
        "management/certificates/<int:pk>/delete/",
        views.admin_certificate_delete,
        name="admin_certificate_delete",
    ),
    path("management/statistics/", views.admin_statistics, name="admin_statistics"),
    path("management/audit/", views.admin_audit_logs, name="admin_audit_logs"),
    path("management/deadlines/", views.admin_deadlines, name="admin_deadlines"),
    path("management/reports/excel/", views.export_reports_excel, name="export_reports_excel"),
    path("management/reports/pdf/", views.export_reports_pdf, name="export_reports_pdf"),
]
