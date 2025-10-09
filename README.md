This is a minimal Django project that implements models for a student grade tracking exercise.

Key points implemented:
- Custom user model using email for login (`grades.User`).
- `is_admin` boolean on user.
- `Subject` model with unique name.
- `Enrollment` linking `User` and `Subject` with unique constraint so a student can't take the same subject twice.
- `grade` can be blank/null.
- `created_at` and `updated_at` timestamps on models.

To run the tests:
1. Create a virtual environment and install dependencies from `requirements.txt`.
2. Run `python manage.py test`.
