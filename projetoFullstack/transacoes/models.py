from django.db import models

# Create your models here.

class Transacao(models.Model):
    descricao = models.CharField(max_length=100)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=50)
    tipo = models.CharField(max_length=10, choices=[('entrada', 'Entrada'), ('saida', 'Saída')])
    data = models.DateTimeField(auto_now_add=True)
    data_transacao = models.DateTimeField()

    def __str__(self):
        return f"{self.descricao} - {self.valor} - {self.data} - {self.categoria} - {self.tipo}"