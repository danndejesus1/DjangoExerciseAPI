from django.db import migrations


def create_teacher_group(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    User = apps.get_model('grades', 'User')

    # Permissions we want teachers to have
    perm_codenames = [
        'add_subject', 'change_subject', 'view_subject',
        'add_enrollment', 'change_enrollment', 'view_enrollment'
    ]

    perms = Permission.objects.filter(codename__in=perm_codenames)

    teacher_group, created = Group.objects.get_or_create(name='Teacher')
    for p in perms:
        teacher_group.permissions.add(p)
    teacher_group.save()

    # Add existing non-superuser users who are staff-equivalent (is_student=False) to the group
    for u in User.objects.filter(is_student=False, is_superuser=False):
        u.groups.add(teacher_group)
        u.save()


def remove_teacher_group(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    try:
        g = Group.objects.get(name='Teacher')
        g.delete()
    except Group.DoesNotExist:
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('grades', '0002_rename_is_staff_user_is_student'),
    ]

    operations = [
        migrations.RunPython(create_teacher_group, remove_teacher_group),
    ]
