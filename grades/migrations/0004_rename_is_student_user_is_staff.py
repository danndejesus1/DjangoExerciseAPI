from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0003_create_teacher_group'),
    ]

    operations = [
        migrations.RenameField(
            model_name='user',
            old_name='is_student',
            new_name='is_staff',
        ),
    ]
