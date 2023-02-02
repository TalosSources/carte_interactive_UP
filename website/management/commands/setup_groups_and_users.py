import logging

import django.contrib.auth
import django.core.management.base
from django.contrib.auth import models as auth_models

logging.basicConfig(level=logging.DEBUG)


def remove_permissions_from_content_admin_group(i_content_type__app_label: str, i_codenames=None):
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


# Creating a ContentAdmin group and user

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
remove_permissions_from_content_admin_group("website", i_codenames=website_codenames)
remove_permissions_from_content_admin_group("auth")
"""
remove_permissions_from_content_admin_group("admin")
remove_permissions_from_content_admin_group("contenttypes")
remove_permissions_from_content_admin_group("sessions")
"""
content_admin_group.save()

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
algorithm: pbkdf2_sha256 iterations: 390000 salt: GbHiXI**************** hash: AvUyQA**********************************
)
"""
a_content_admin_user.groups.add(content_admin_group)
a_content_admin_user.is_staff = True
a_content_admin_user.save()

# Creating a super user
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
    help = "Create a ContentAdmin group, a test user (belonging to this group), and a superuser"

    def add_arguments(self, parser):
        pass
        # parser.add_argument("--clear", action="store_true")  # -available under "options" in help
        # parser.add_argument("--sk3_data_types", nargs="*", type=str)  # -available under "positional arguments" in help

    def handle(self, *args, **options):
        logging.debug(f"{args=}")
        logging.debug(f"{options=}")
