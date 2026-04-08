from django.shortcuts import redirect, render


def login(request):
    return render(request, "login.html")


def register(request):
    return render(request, "register.html")


def dashboard(request):
    return render(request, "dashboard.html")


def profile(request):
    return redirect("dashboard")


def add_achievement(request):
    return render(request, "add_achievement.html")


def calculate(request):
    return render(request, "calculate.html")


def admin_panel(request):
    return render(request, "admin.html")
