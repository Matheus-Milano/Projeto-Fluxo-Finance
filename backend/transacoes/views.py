from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import Transacao
from .serializers import TransacaoSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def registrar_usuario(request):
    nome = request.data.get('nome')
    email = request.data.get('email')
    senha = request.data.get('senha')

    if not email or not senha or not nome:
        return Response({'erro': 'Preencha nome, e-mail e senha.'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=email).exists():
        return Response({'erro': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'nome': user.first_name}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_usuario(request):
    email = request.data.get('email')
    senha = request.data.get('senha')

    user = authenticate(username=email, password=senha)
    if not user:
        return Response({'erro': 'E-mail ou senha inválidos.'}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key, 'nome': user.first_name})

class TransacaoViewSet(viewsets.ModelViewSet):
    serializer_class = TransacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Retorna APENAS as transações do usuário logado
        return Transacao.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        # Salva a transação vinculando automaticamente ao usuário logado
        serializer.save(usuario=self.request.user)