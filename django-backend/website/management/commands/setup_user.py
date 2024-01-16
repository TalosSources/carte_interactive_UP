import logging

import django.contrib.auth
import django.core.management.base
from django.contrib.auth import models as auth_models

logging.basicConfig(level=logging.INFO)


def create_or_update_content_admin_group() -> auth_models.Group:
    def remove_permissions(i_content_type__app_label: str, i_codenames=None):
        if i_codenames is not None:
            remove_permission_list = auth_models.Permission.objects.filter(
                content_type__app_label=i_content_type__app_label, codename__in=i_codenames)
        else:
            remove_permission_list = auth_models.Permission.objects.filter(
                content_type__app_label=i_content_type__app_label)
        logging.debug(f"{remove_permission_list=}")
        # content_admin_group.permissions.remove(remove_permission_list)
        for rem_permission in remove_permission_list:
            content_admin_group.permissions.remove(rem_permission)

    # 2014: https://stackoverflow.com/questions/22250352/programmatically-create-a-django-group-with-permissions
    (content_admin_group, _) = auth_models.Group.objects.get_or_create(name="ContentAdmin")
    all_permissions_list = auth_models.Permission.objects.all()
    content_admin_group.permissions.set(all_permissions_list)

    protected_tables = ["region", "tag", "language"]
    website_codenames = [feature+"_"+table for feature in ["add", "change", "delete"] for table in protected_tables]
    # Using a blacklist approach for the ContentAdmin group (we may want to change this in the future)
    remove_permissions("website", i_codenames=website_codenames)
    remove_permissions("auth")
    """
    remove_permissions("admin")
    remove_permissions("contenttypes")
    remove_permissions("sessions")
    """
    content_admin_group.save()
    return content_admin_group


def create_or_update_user(username, passw) -> auth_models.User:
    user_model = django.contrib.auth.get_user_model()
    # user_model: auth_models.User
    # -https://docs.djangoproject.com/en/4.1/topics/auth/customizing/#django.contrib.auth.get_user_model
    (user, _) = user_model.objects.get_or_create(
        username=username, password="invalid")
    user.set_password(passw)
    user.save()
    return user


def create_content_admin(username, password):
    ca_group = create_or_update_content_admin_group()
    a_content_admin_user = create_or_update_user(username, password)
    a_content_admin_user.groups.add(ca_group)
    a_content_admin_user.is_staff = True
    a_content_admin_user.save()


def create_superuser(username, password):
    a_super_user = create_or_update_user(username, password)
    a_super_user.is_staff = True
    a_super_user.is_superuser = True
    a_super_user.save()


# content_admin_group.user_set.add(a_content_admin_user)
# -https://stackoverflow.com/questions/10372877/how-to-create-a-user-in-django


class Command(django.core.management.base.BaseCommand):
    help = "Create a ContentAdmin user or a superuser."

    def add_arguments(self, parser):
        parser.add_argument("--content_admin", "--ca", action="store_true")
        parser.add_argument("--super_user", "--su", action="store_true")
        parser.add_argument("--username", "-u")
        parser.add_argument("--password", "-p")

    def handle(self, *args, **options):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")

        if not options["content_admin"] and not options["super_user"]:
            print("Error: No action given, so no action taken. What shall I do?")
            return
        if options["content_admin"] and options["super_user"]:
            print("Only one of content_admin or super_user is allowed.")
            return

        username = options["username"]
        if not username:
            print("You need to supply a username")
            return

        passw = options["password"]
        if not passw:
            print("You need to supply a password")
            return

        if options["content_admin"]:
            create_content_admin(username, passw)
        if options["super_user"]:
            create_superuser(username, passw)

