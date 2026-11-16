from rest_framework import serializers
from .models import Transacao, PerfilFinanceiro

class PerfilFinanceiroSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilFinanceiro
        fields = ['salario_mensal']


class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = ['id', 'descricao', 'valor', 'tipo', 'mes_referencia', 'criado_em']