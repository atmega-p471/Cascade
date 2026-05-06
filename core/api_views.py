from django.contrib.auth.models import User
from django.db.models import Count
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .api_serializers import (
    AdminUserSerializer,
    CertificateSerializer,
    PointAdjustmentSerializer,
    ScholarshipCalculationSerializer,
    ScholarshipSerializer,
    StudentProfileSerializer,
)
from .models import Certificate, PointAdjustment, Scholarship, ScholarshipCalculation, StudentProfile
from .services import try_extract_text


class ProfileApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class CertificateApiViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Certificate.objects.filter(user=self.request.user)
        level = self.request.query_params.get("level")
        place = self.request.query_params.get("place")
        show_archived = self.request.query_params.get("archived") == "1"
        sort = self.request.query_params.get("sort", "-event_date")
        allowed_sorting = {"event_date", "-event_date", "auto_points", "-auto_points", "created_at"}

        if level:
            queryset = queryset.filter(event_level=level)
        if place:
            queryset = queryset.filter(place=place)
        if not show_archived:
            queryset = queryset.exclude(status="archived")
        if sort in allowed_sorting:
            queryset = queryset.order_by(sort)
        return queryset

    def perform_create(self, serializer):
        certificate = serializer.save(user=self.request.user)
        certificate.extracted_text = try_extract_text(certificate.file.path)
        certificate.save(update_fields=["extracted_text", "updated_at"])


class ScholarshipApiViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ScholarshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Scholarship.objects.filter(is_active=True).order_by("name")


class ScholarshipCalculationApiViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ScholarshipCalculationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ScholarshipCalculation.objects.filter(user=self.request.user).select_related("scholarship")


class AdminUserApiViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().order_by("id")


class AdminCertificateApiViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Certificate.objects.select_related("user").all()


class AdminPointAdjustmentApiViewSet(viewsets.ModelViewSet):
    serializer_class = PointAdjustmentSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = PointAdjustment.objects.select_related("user", "created_by").all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AdminStatisticsApiView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        by_level = (
            Certificate.objects.values("event_level")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        by_place = Certificate.objects.values("place").annotate(total=Count("id")).order_by("-total")
        top_scholarships = (
            ScholarshipCalculation.objects.values("scholarship__name")
            .annotate(total=Count("id"))
            .order_by("-total")
        )
        by_user = (
            Certificate.objects.values("user__username")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )
        return Response(
            {
                "by_level": list(by_level),
                "by_place": list(by_place),
                "top_scholarships": list(top_scholarships),
                "by_user": list(by_user),
            }
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me_api(request):
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_staff": user.is_staff,
        }
    )
