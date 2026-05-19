from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter

from .api_views import (
    AdminAuditLogApiViewSet,
    AdminCertificateApiViewSet,
    AdminPointAdjustmentApiViewSet,
    AdminStatisticsApiView,
    AdminUserApiViewSet,
    CertificateApiViewSet,
    NotificationApiViewSet,
    ProfileApiView,
    ScholarshipDeadlineApiViewSet,
    ScholarshipApiViewSet,
    ScholarshipCalculationApiViewSet,
    me_api,
)

router = DefaultRouter()
router.register("certificates", CertificateApiViewSet, basename="api-certificates")
router.register("scholarships", ScholarshipApiViewSet, basename="api-scholarships")
router.register("calculations", ScholarshipCalculationApiViewSet, basename="api-calculations")
router.register("notifications", NotificationApiViewSet, basename="api-notifications")
router.register("deadlines", ScholarshipDeadlineApiViewSet, basename="api-deadlines")

admin_router = DefaultRouter()
admin_router.register("users", AdminUserApiViewSet, basename="api-admin-users")
admin_router.register("certificates", AdminCertificateApiViewSet, basename="api-admin-certificates")
admin_router.register("adjustments", AdminPointAdjustmentApiViewSet, basename="api-admin-adjustments")
admin_router.register("audit-logs", AdminAuditLogApiViewSet, basename="api-admin-audit-logs")

urlpatterns = [
    path("schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="api-schema"), name="api-swagger"),
    path("redoc/", SpectacularRedocView.as_view(url_name="api-schema"), name="api-redoc"),
    path("auth/token/", obtain_auth_token, name="api-token"),
    path("me/", me_api, name="api-me"),
    path("profile/", ProfileApiView.as_view(), name="api-profile"),
    path("admin/statistics/", AdminStatisticsApiView.as_view(), name="api-admin-statistics"),
    path("admin/", include(admin_router.urls)),
    path("", include(router.urls)),
]
