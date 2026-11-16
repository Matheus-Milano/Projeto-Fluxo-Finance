from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    TransacaoListCreate,
    TransacaoDetail,
    PerfilSalarioView,
    ResumoMensalView,
    MelhoresInvestimentosView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('transacoes/', TransacaoListCreate.as_view(), name='transacoes'),
    path('transacoes/<int:pk>/', TransacaoDetail.as_view(), name='transacao-detail'),
    path('perfil/salario/', PerfilSalarioView.as_view(), name='perfil-salario'),
    path('resumo/', ResumoMensalView.as_view(), name='resumo-mensal'),
    path('investimentos/', MelhoresInvestimentosView.as_view(), name='investimentos'),
]