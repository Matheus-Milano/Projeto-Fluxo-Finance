from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransacaoViewSet, registrar_usuario, login_usuario

router = DefaultRouter()
router.register(r'transacoes', TransacaoViewSet, basename='transacao')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', registrar_usuario),
    path('login/', login_usuario),
]