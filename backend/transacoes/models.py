from django.db import models
from django.contrib.auth.models import User

class PerfilFinanceiro(models.Model):
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    salario_mensal = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Perfil de {self.usuario.username} - Salário: R$ {self.salario_mensal}"


class Transacao(models.Model):
    TIPO_CHOICES = [
        ('FIXA', 'Despesa Fixa (Todo mês)'),
        ('VARIAVEL', 'Despesa Variável (Apenas este mês)'),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='VARIAVEL')
    mes_referencia = models.CharField(max_length=7, default='2026-11')  # Formato YYYY-MM
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.descricao} ({self.tipo}) - R$ {self.valor}"