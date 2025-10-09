from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from grades import views as grade_views
from rest_framework.authtoken import views as drf_authtoken_views
from django.views.generic import RedirectView

router = routers.DefaultRouter()
router.register(r'users', grade_views.UserViewSet, basename='user')
router.register(r'subjects', grade_views.SubjectViewSet, basename='subject')
router.register(r'enrollments', grade_views.EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    # Redirect root URL to the API root so http://127.0.0.1:8000/ doesn't 404
    path('', RedirectView.as_view(url='/api/', permanent=False)),

    path('admin/', admin.site.urls),
    path('api/', include((router.urls, 'api'), namespace='api')),
    path('api-token-auth/', drf_authtoken_views.obtain_auth_token, name='api_token_auth'),
]
