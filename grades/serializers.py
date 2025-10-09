from rest_framework import serializers
from django.db import IntegrityError
from .models import User, Subject, Enrollment

# --- User serializer (same as before) ---
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'is_staff', 'is_admin')
        read_only_fields = ('is_staff', 'is_admin')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


# --- Subject / Enrollment serializers ---
class EnrollmentNestedSerializer(serializers.ModelSerializer):
    """
    Minimal nested view of an enrollment used inside Subject detail for admin views.
    It contains the student's id + email and the grade.
    """
    student = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'grade')

    def get_student(self, obj):
        # return small student summary
        return {'id': obj.student.id, 'email': obj.student.email}


class SubjectSerializer(serializers.ModelSerializer):
    """
    SubjectSerializer now exposes:
    - student_grade: the logged-in student's grade for the subject (or null)
    - enrollments: list of students+grades (admin/staff only)
    Both fields are read-only and depend on the request user from serializer context.
    """
    student_grade = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ('id', 'name', 'created_at', 'updated_at', 'student_grade', 'enrollments')
        read_only_fields = ('created_at', 'updated_at', 'student_grade', 'enrollments')

    def get_student_grade(self, obj):
        """
        If the request has an authenticated non-admin user, return their grade (string or null).
        Otherwise return None (e.g. unauthenticated or admin).
        """
        request = self.context.get('request', None)
        if not request or not request.user or not request.user.is_authenticated:
            return None

        # Admins should not see student_grade here (they get the full enrollments list)
        if request.user.is_staff or getattr(request.user, "is_admin", False):
            return None

        # Find the enrollment for the current user and this subject
        enrollment = obj.enrollments.filter(student=request.user).first()
        return enrollment.grade if enrollment else None

    def get_enrollments(self, obj):
        """
        If the request user is admin/staff, return the list of enrollments (student + grade).
        Otherwise return empty list (students will get their grade via student_grade).
        """
        request = self.context.get('request', None)
        if not request or not request.user or not request.user.is_authenticated:
            return []

        if request.user.is_staff or getattr(request.user, "is_admin", False):
            # return all enrollments for this subject to admin
            qs = obj.enrollments.select_related('student').all()
            return EnrollmentNestedSerializer(qs, many=True).data

        return []


class EnrollmentSerializer(serializers.ModelSerializer):
    # student is optional for incoming requests and defaults to the current user
    student = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        default=serializers.CurrentUserDefault()
    )
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'subject', 'grade', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    def validate(self, data):
        # student will be set by CurrentUserDefault if not provided
        student = data.get('student')
        subject = data.get('subject')
        if student is None or subject is None:
            raise serializers.ValidationError("student and subject must be provided (student is auto-filled for authenticated users).")
        if Enrollment.objects.filter(student=student, subject=subject).exists():
            raise serializers.ValidationError("Student is already enrolled in this subject.")
        return data

    def create(self, validated_data):
        try:
            enrollment = Enrollment.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError("Student is already enrolled in this subject.")
        return enrollment