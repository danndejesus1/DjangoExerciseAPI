from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import User, Subject, Enrollment
from .serializers import UserSerializer, SubjectSerializer, EnrollmentSerializer
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        # Prevent deleting subjects that have enrollments
        subject = self.get_object()
        if subject.enrollments.exists():
            return Response({"detail": "Cannot delete subject with enrollments."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['delete'], url_path=r'students/(?P<student_id>[^/.]+)', permission_classes=[permissions.IsAdminUser])
    def remove_student(self, request, pk=None, student_id=None):
        """
        Admin-only: remove a student from this subject by student id, only if the enrollment is not graded.
        URL: DELETE /api/subjects/{subject_id}/students/{student_id}/
        """
        # get subject (self.get_object will raise 404 if not found)
        subject = self.get_object()

        # find the enrollment for this student+subject
        try:
            enrollment = Enrollment.objects.get(subject=subject, student__id=student_id)
        except Enrollment.DoesNotExist:
            return Response({"detail": "Enrollment not found."}, status=status.HTTP_404_NOT_FOUND)

        # refuse to remove if graded
        if enrollment.grade and str(enrollment.grade).strip() != '':
            return Response({"detail": "Cannot remove a student from a graded enrollment."}, status=status.HTTP_400_BAD_REQUEST)

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('student', 'subject').all()
    serializer_class = EnrollmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'is_admin', False):
            return super().get_queryset()
        return super().get_queryset().filter(student=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_staff or getattr(user, 'is_admin', False)):
            # Force student to be current user for regular users
            serializer.save(student=user)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        # Prevent deleting enrollment if it has a non-empty grade
        enrollment = self.get_object()
        if enrollment.grade and str(enrollment.grade).strip() != '':
            return Response({"detail": "Cannot delete a graded enrollment."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)