from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from .models import Certificate, PointAdjustment, Scholarship, StudentProfile


class DateInput(forms.DateInput):
    input_type = "date"


class StudentProfileForm(forms.ModelForm):
    first_name = forms.CharField(label="Имя", max_length=150, required=False)
    last_name = forms.CharField(label="Фамилия", max_length=150, required=False)

    class Meta:
        model = StudentProfile
        fields = (
            "record_book_number",
            "birth_date",
            "institution",
            "specialty",
            "course",
            "study_form",
            "portfolio",
        )
        widgets = {"birth_date": DateInput()}

    def __init__(self, *args, **kwargs):
        user = kwargs.pop("user", None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields["first_name"].initial = user.first_name
            self.fields["last_name"].initial = user.last_name

    def save(self, commit=True):
        profile = super().save(commit=False)
        if commit:
            profile.save()
        return profile


class CertificateForm(forms.ModelForm):
    class Meta:
        model = Certificate
        fields = ("title", "file", "event_level", "place", "event_date")
        widgets = {"event_date": DateInput()}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["file"].widget.attrs.update(
            {"accept": "image/*,.pdf", "capture": "environment"}
        )


class CertificateAdminForm(forms.ModelForm):
    class Meta:
        model = Certificate
        fields = ("title", "event_level", "place", "event_date", "status", "custom_points")
        widgets = {"event_date": DateInput()}


class ScholarshipCalculationForm(forms.Form):
    scholarship = forms.ModelChoiceField(
        queryset=Scholarship.objects.filter(is_active=True), label="Стипендия"
    )


class PointAdjustmentForm(forms.ModelForm):
    class Meta:
        model = PointAdjustment
        fields = ("value", "reason")


class AdminUserCreateForm(UserCreationForm):
    first_name = forms.CharField(label="Имя", max_length=150, required=False)
    last_name = forms.CharField(label="Фамилия", max_length=150, required=False)
    email = forms.EmailField(required=False)
    is_staff = forms.BooleanField(label="Администратор", required=False, initial=False)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "is_staff")


class AdminUserUpdateForm(forms.ModelForm):
    first_name = forms.CharField(label="Имя", max_length=150, required=False)
    last_name = forms.CharField(label="Фамилия", max_length=150, required=False)
    email = forms.EmailField(required=False)
    is_staff = forms.BooleanField(label="Администратор", required=False)
    is_active = forms.BooleanField(label="Активен", required=False)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "is_staff", "is_active")
