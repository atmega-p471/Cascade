from django.urls import include, path

urlpatterns = [
    path("", include("scholarship.urls")),
]
