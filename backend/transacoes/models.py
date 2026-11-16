from django.db import models
from django.contrib.auth.models import User

class Transacao(models.Model):
    TIPO_CHOICES = [
        ('salario', 'Salário'),
        ('fixa', 'Despesa Fixa'),
        ('alheia', 'Despesa Alheia'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    data_transacao = models.DateTimeField()

    def __str__(self):
        return f"{self.descricao} - R$ {self.valor}"