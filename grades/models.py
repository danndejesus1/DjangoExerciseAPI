from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """
    Custom manager for User.

    - create_user: helper that normalizes email, hashes password and saves the user.
      We accept is_admin/is_staff so callers (e.g., createsuperuser) can create privileged users.
    - create_superuser: convenience wrapper that marks the created user as admin/staff/superuser.
    """

    def create_user(self, email, password=None, is_admin=False, is_staff=False, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, is_admin=is_admin, is_staff=is_staff, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        # create a user with admin/staff/superuser privileges
        return self.create_user(email, password, is_admin=True, is_staff=True, is_superuser=True, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that uses email for authentication.

    Fields:
    - email: unique identifier and login field (USERNAME_FIELD).
    - first_name / last_name: optional profile fields.
    - is_active: whether the account is active.
    - is_staff: standard Django flag used by admin checks (grants admin access in many places).
    - is_admin: an explicit boolean used in our permission helpers to mark admin roles.
    - date_joined: timestamp when the account was created.

    Notes:
    - We set USERNAME_FIELD = 'email' so all auth uses the email address.
    - PermissionsMixin provides groups and user_permissions support.
    """

    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # attach the custom manager
    objects = UserManager()

    # use email as the unique identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    # standard is_staff boolean field is used for admin access in Django


class Subject(models.Model):
    """
    Subject represents a course/topic that students can enroll in.

    Fields:
    - name: human-readable subject name. Unique to prevent duplicate subject names.
    - created_at / updated_at: automatic timestamps for auditing (bonus requirement).

    Important constraint:
    - name is unique so there cannot be two subjects with the same exact name.
    """

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # name is unique via the field attribute; kept explicit for clarity
        pass

    def __str__(self):
        return self.name


class Enrollment(models.Model):
    """
    Enrollment links a User (student) to a Subject and optionally stores a grade.

    Fields:
    - student: FK to `User` (the student taking the subject). `related_name='enrollments'` allows
      convenient reverse lookups: student.enrollments.all().
    - subject: FK to `Subject` with `related_name='enrollments'` so subject.enrollments.all() works.
    - grade: short string for grade (blank/null allowed per requirement: a student may initially have a blank grade).
    - created_at / updated_at: timestamps for audit/history.

    Constraints / business rules:
    - unique_together(student, subject): prevents a student from enrolling in the same subject twice.

    String representation includes student email, subject name and the current grade.
    """

    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='enrollments')
    # grade is allowed to be blank initially (blank=True, null=True)
    grade = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure a given (student, subject) pair can only exist once at DB-level
        unique_together = (('student', 'subject'),)

    def __str__(self):
        return f"{self.student.email} - {self.subject.name} ({self.grade})"
