import pymysql
from django.db.backends.base.base import BaseDatabaseWrapper

pymysql.install_as_MySQLdb()

# Ignora a checagem de versão MySQL 8.4+ do Django 6 para aceitar o TiDB Cloud
BaseDatabaseWrapper.check_database_version_supported = lambda self: None