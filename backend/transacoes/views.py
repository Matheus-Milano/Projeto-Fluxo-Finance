from django.shortcuts import render
from rest_framework import viewsets
from .models import Transacao
from .serializers import TransacaoSerializer


# Create your views here.
class TransacaoViewSet(viewsets.ModelViewSet):
    queryset = Transacao.objects.all()
    serializer_class = TransacaoSerializer