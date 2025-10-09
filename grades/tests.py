from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from grades.models import Subject, Enrollment

User = get_user_model()


class ModelsTest(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(email='student@example.com', password='pass')
        self.admin = User.objects.create_user(email='admin@example.com', password='pass', is_admin=True)

    def test_email_login_and_flags(self):
        self.assertEqual(self.student.email, 'student@example.com')
        self.assertFalse(self.student.is_admin)
        self.assertTrue(self.admin.is_admin)

    def test_subject_unique(self):
        Subject.objects.create(name='Math')
        with self.assertRaises(IntegrityError):
            # create another subject with same name should violate unique constraint
            Subject.objects.create(name='Math')

    def test_student_cant_take_same_subject_twice(self):
        subj = Subject.objects.create(name='History')
        Enrollment.objects.create(student=self.student, subject=subj)
        with self.assertRaises(IntegrityError):
            Enrollment.objects.create(student=self.student, subject=subj)

    def test_grade_can_be_blank(self):
        subj = Subject.objects.create(name='Science')
        e = Enrollment.objects.create(student=self.student, subject=subj)
        self.assertIsNone(e.grade)

    def test_timestamps_created(self):
        subj = Subject.objects.create(name='Art')
        self.assertIsNotNone(subj.created_at)
        self.assertIsNotNone(subj.updated_at)
        e = Enrollment.objects.create(student=self.student, subject=subj)
        self.assertIsNotNone(e.created_at)
        self.assertIsNotNone(e.updated_at)
