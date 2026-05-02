from django.urls import path

from . import views

urlpatterns = [
    path("", views.login, name="login"),
    path("register/", views.register, name="register"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("profile/", views.profile, name="profile"),
    path("achievements/add/", views.add_achievement, name="add_achievement"),
    path("calculate/", views.calculate, name="calculate"),
    path("admin/", views.admin_panel, name="admin"),
]
