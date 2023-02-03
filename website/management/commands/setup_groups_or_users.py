import logging

import django.contrib.auth
import django.core.management.base
from django.contrib.auth import models as auth_models

logging.basicConfig(level=logging.INFO)


def create_content_admin_group() -> auth_models.Group:
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
    (content_admin_group, group_was_created_bool) = auth_models.Group.objects.get_or_create(name="ContentAdmin")
    content_admin_group: auth_models.Group
    all_permissions_list = auth_models.Permission.objects.all()
    logging.debug("Permission codenames:")
    for permission in all_permissions_list:
        permission: auth_models.Permission
        logging.debug(permission.codename)
    content_admin_group.permissions.set(all_permissions_list)

    website_codenames = ["change_region", "delete_region", "add_region"]
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


def create_content_admin_example_user(i_content_admin_group):
    user_model = django.contrib.auth.get_user_model()
    # user_model: auth_models.User
    # -https://docs.djangoproject.com/en/4.1/topics/auth/customizing/#django.contrib.auth.get_user_model
    (a_content_admin_user, user_was_created_bool) = user_model.objects.get_or_create(
        username="a_content_admin", password="4dnvxHMx")
    a_content_admin_user: auth_models.User
    a_content_admin_user.set_password("4dnvxHMx")
    """
    Strange, but we had to add set_password, even though we already give the password when creating the user
    
    The bug we got before that was that we couldn't log in with this user. If we logged in with the superuser and looked
    at the password field we could see this:
    
    "Invalid password format or unknown hashing algorithm."
    
    (normally it would say something like
    algorithm: pbkdf2_sha256 iterations: 390000 salt: GbHiXI**************** hash: AvUyQA******************************
    )
    """
    a_content_admin_user.groups.add(i_content_admin_group)
    a_content_admin_user.is_staff = True
    a_content_admin_user.save()


def create_superuser_example_user():
    user_model = django.contrib.auth.get_user_model()
    # -https://docs.djangoproject.com/en/4.1/topics/auth/customizing/#django.contrib.auth.get_user_model
    (a_super_user, super_user_was_created_bool) = user_model.objects.get_or_create(
        username="root", password="QeVKEqt2")
    a_super_user.set_password("QeVKEqt2")
    a_super_user.is_staff = True
    a_super_user.is_superuser = True
    a_super_user.save()


# content_admin_group.user_set.add(a_content_admin_user)
# -https://stackoverflow.com/questions/10372877/how-to-create-a-user-in-django


class Command(django.core.management.base.BaseCommand):
    help = "Create a ContentAdmin group, a test user (belonging to this group), and/or a superuser."

    def add_arguments(self, parser):
        parser.add_argument("--ca_group", action="store_true")
        parser.add_argument("--ca_example_user", action="store_true")
        parser.add_argument("--su_example_user", action="store_true")

    def handle(self, *args, **options):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")

        if not options["ca_group"] and not options["ca_example_user"] and not options["su_example_user"]:
            print("Error: No flag given, so no action taken")
            return
        if not options["ca_group"] and options["ca_example_user"]:
            print("Error: A ContentAdmin group must be created to create a ContentAdmin user")
            return
        if options["ca_group"]:
            print("Creating a ContentAdmin group")
            content_admin_group = create_content_admin_group()
            if options["ca_example_user"]:
                print("Creating a ContentAdmin example user")
                create_content_admin_example_user(content_admin_group)
        if options["su_example_user"]:
            print("Creating a superuser example user")
            create_superuser_example_user()
