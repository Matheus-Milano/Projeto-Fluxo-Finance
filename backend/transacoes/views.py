import requests
from decimal import Decimal
from django.db.models import Sum
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from .models import Transacao, PerfilFinanceiro
from .serializers import TransacaoSerializer, PerfilFinanceiroSerializer


# --- AUTENTICAÇÃO (CADASTRO E LOGIN) ---

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        nome = request.data.get('nome')
        email = request.data.get('email')
        password = request.data.get('password')

        if User.objects.filter(username=email).exists():
            return Response({'error': 'Este e-mail já está cadastrado.'}, status=400)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=nome or ''
        )
        PerfilFinanceiro.objects.get_or_create(usuario=user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'nome': user.first_name}, status=201)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(username=email, password=password)

        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'nome': user.first_name})
        return Response({'error': 'E-mail ou senha inválidos.'}, status=401)


# --- PERFIL E SALÁRIO MENSAL ---

class PerfilSalarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil, _ = PerfilFinanceiro.objects.get_or_create(usuario=request.user)
        return Response({'salario_mensal': perfil.salario_mensal})

    def post(self, request):
        perfil, _ = PerfilFinanceiro.objects.get_or_create(usuario=request.user)
        salario = request.data.get('salario_mensal', 0)
        perfil.salario_mensal = Decimal(str(salario))
        perfil.save()
        return Response({'salario_mensal': perfil.salario_mensal})


# --- TRANSAÇÕES (DESPESAS FIXAS E VARIÁVEIS) ---

class TransacaoListCreate(ListCreateAPIView):
    serializer_class = TransacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        mes = self.request.query_params.get('mes', '2026-11')
        fixas = Transacao.objects.filter(usuario=self.request.user, tipo='FIXA')
        variaveis = Transacao.objects.filter(
            usuario=self.request.user, tipo='VARIAVEL', mes_referencia=mes
        )
        return (fixas | variaveis).order_by('-criado_em')

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)


class TransacaoDetail(RetrieveUpdateDestroyAPIView):
    serializer_class = TransacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transacao.objects.filter(usuario=self.request.user)


# --- RESUMO MENSAL E COFRE ACUMULADO ---

class ResumoMensalView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mes_atual = request.query_params.get('mes', '2026-11')
        perfil, _ = PerfilFinanceiro.objects.get_or_create(usuario=request.user)
        salario = perfil.salario_mensal

        total_fixas = Transacao.objects.filter(
            usuario=request.user, tipo='FIXA'
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        total_variaveis_mes = Transacao.objects.filter(
            usuario=request.user, tipo='VARIAVEL', mes_referencia=mes_atual
        ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')

        sobra_mes_atual = salario - (total_fixas + total_variaveis_mes)

        meses_ativos = set(
            Transacao.objects.filter(usuario=request.user, tipo='VARIAVEL')
            .values_list('mes_referencia', flat=True)
        )
        meses_ativos.add(mes_atual)

        total_guardado = Decimal('0.00')
        historico_mensal = []

        for m in sorted(meses_ativos):
            var_m = Transacao.objects.filter(
                usuario=request.user, tipo='VARIAVEL', mes_referencia=m
            ).aggregate(total=Sum('valor'))['total'] or Decimal('0.00')
            sobra_m = salario - (total_fixas + var_m)
            total_guardado += sobra_m
            historico_mensal.append({
                'mes': m,
                'sobra': float(sobra_m),
                'guardado_acumulado': float(total_guardado),
                'gastos': float(total_fixas + var_m)
            })

        return Response({
            'mes': mes_atual,
            'salario': float(salario),
            'total_fixas': float(total_fixas),
            'total_variaveis': float(total_variaveis_mes),
            'sobra_mes': float(sobra_mes_atual),
            'total_guardado': float(total_guardado),
            'historico': historico_mensal
        })


# --- MELHORES INVESTIMENTOS (API BANCO CENTRAL) ---

class MelhoresInvestimentosView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        selic_anual = 11.25
        try:
            resp = requests.get(
                'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json',
                timeout=4
            )
            if resp.status_code == 200:
                selic_anual = float(resp.json()[0]['valor'])
        except Exception:
            pass

        cdi_anual = round(selic_anual - 0.10, 2)

        opcoes = [
            {
                'nome': 'Tesouro Selic 2029',
                'categoria': 'Renda Fixa • Segurança Máxima',
                'rentabilidade': f'{selic_anual:.2f}% ao ano (100% Selic)',
                'taxa_anual': selic_anual,
                'liquidez': 'Diária (D+1)',
                'risco': 'Baixíssimo (Garantia Tesouro Nacional)',
                'onde_encontrar': 'Tesouro Direto, Nubank, Inter, XP, Rico',
                'ideal_para': 'Reserva de emergência e sobra mensal'
            },
            {
                'nome': 'CDB Liquidez Diária (100% a 110% CDI)',
                'categoria': 'Renda Fixa • Bancos Digitais',
                'rentabilidade': f'{cdi_anual:.2f}% a {round(cdi_anual * 1.10, 2):.2f}% ao ano',
                'taxa_anual': round(cdi_anual * 1.05, 2),
                'liquidez': 'Imediata / Diária',
                'risco': 'Baixo (Protegido pelo FGC até R$ 250 mil)',
                'onde_encontrar': 'Nubank (Caixinhas), Mercado Pago, Sofisa Direto, C6 Bank',
                'ideal_para': 'Dinheiro do dia a dia rendendo mais que a poupança'
            },
            {
                'nome': 'LCI / LCA Pós-Fixada (Isenta de IR)',
                'categoria': 'Renda Fixa • Isento de Imposto',
                'rentabilidade': '~90% do CDI (equivale a ~106% CDB)',
                'taxa_anual': round(cdi_anual * 0.90, 2),
                'liquidez': 'Após carência (9 meses)',
                'risco': 'Baixo (Protegido pelo FGC até R$ 250 mil)',
                'onde_encontrar': 'Banco Inter, BTG Pactual, Itaú, Banco do Brasil',
                'ideal_para': 'Metas de médio prazo sem desconto de Imposto de Renda'
            }
        ]

        return Response({
            'selic_atual': selic_anual,
            'cdi_atual': cdi_anual,
            'fonte': 'Banco Central do Brasil (API Oficial SGS)',
            'investimentos': opcoes
        })