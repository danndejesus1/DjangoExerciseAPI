from rest_framework import serializers
from django.db import IntegrityError
from .models import User, Subject, Enrollment

# --- User serializer (same as before) ---
class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and representing users.
    - Function: create(...)  -> create a new User and hash the password.
    """
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'is_staff', 'is_admin')
        read_only_fields = ('is_staff', 'is_admin')

    # Function: create
    # Purpose: called when serializer.save() is used to create a new User.
    # Behavior: pops 'password' from validated_data, hashes it with set_password,
    # then saves and returns the user instance.
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
    - Function: get_student(obj) -> returns a small student summary (id + email).
    """
    student = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'grade')

    # Function: get_student
    # Purpose: produces the nested representation for the `student` field
    # (used inside EnrollmentNestedSerializer).
    def get_student(self, obj):
        # return small student summary
        return {'id': obj.student.id, 'email': obj.student.email}


class SubjectSerializer(serializers.ModelSerializer):
    """
    SubjectSerializer:
    - Fields:
      - student_grade: computed grade for the requesting student (if applicable).
      - enrollments: list of enrollments for admin/staff users (nested).
    - Functions:
      - get_student_grade(obj) -> returns grade for current user (or None).
      - get_enrollments(obj) -> returns nested enrollments for admin/staff.
    """
    student_grade = serializers.SerializerMethodField()
    enrollments = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ('id', 'name', 'created_at', 'updated_at', 'student_grade', 'enrollments')
        read_only_fields = ('created_at', 'updated_at', 'student_grade', 'enrollments')

    # Function: get_student_grade
    # Purpose: If request.user is an authenticated non-admin student, return their grade
    # for this subject. Returns None for anonymous users or admin/staff.
    def get_student_grade(self, obj):
        request = self.context.get('request', None)
        if not request or not request.user or not request.user.is_authenticated:
            return None

        # Admins should not see the student-specific grade here
        if request.user.is_staff or getattr(request.user, "is_admin", False):
            return None

        # Find the enrollment for the current user and this subject
        enrollment = obj.enrollments.filter(student=request.user).first()
        return enrollment.grade if enrollment else None

    # Function: get_enrollments
    # Purpose: For admin/staff users, return nested enrollments (student summary + grade).
    # For non-admins return an empty list (they receive their grade via student_grade).
    def get_enrollments(self, obj):
        request = self.context.get('request', None)
        if not request or not request.user or not request.user.is_authenticated:
            return []

        if request.user.is_staff or getattr(request.user, "is_admin", False):
            # return all enrollments for this subject to admin
            qs = obj.enrollments.select_related('student').all()
            # Note: pass context to nested serializer if it needs request later
            return EnrollmentNestedSerializer(qs, many=True).data

        return []


class EnrollmentSerializer(serializers.ModelSerializer):
    
   ## EnrollmentSerializer:
    
    # Field: student
    # Purpose: PrimaryKeyRelatedField for the student FK. Optional on input.
    student = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        default=serializers.CurrentUserDefault()
    )
    # Field: subject
    # Purpose: PrimaryKeyRelatedField for the subject FK. Required for create.
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'subject', 'grade', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')

    # Function: validate
    # Purpose:
    # - On create: ensure both student and subject are present (student may be auto-filled).
    # - Enforces uniqueness of (student, subject), excluding the instance when updating.
    def validate(self, data):
        # derive student/subject taking into account updates (partial) and instance
        if self.instance is not None:
            # update case: prefer provided values, fallback to existing instance
            student = data.get('student', getattr(self.instance, 'student', None))
            subject = data.get('subject', getattr(self.instance, 'subject', None))
        else:
            # create case: data must include both (CurrentUserDefault may fill student earlier)
            student = data.get('student')
            subject = data.get('subject')

        if student is None or subject is None:
            # Non-field error returned to API clients (this is where your "student and subject must be provided" message originates).
            raise serializers.ValidationError("student and subject must be provided (student is auto-filled for authenticated users).")

        # If creating (or student/subject changed), ensure uniqueness
        # Use exclude to allow updating the same enrollment without raising error
        qs = Enrollment.objects.filter(student=student, subject=subject)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Student is already enrolled in this subject.")
        return data

   
    def create(self, validated_data):
        try:
            enrollment = Enrollment.objects.create(**validated_data)
        except IntegrityError:
            raise serializers.ValidationError("Student is already enrolled in this subject.")
        return enrollment