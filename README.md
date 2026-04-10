# 🎲 BoardPay — Sistema Financeiro para Jogos de Tabuleiro

O **BoardPay** é uma solução digital premium para gerenciar a economia de seus jogos de tabuleiro (como Banco Imobiliário) de forma offline, segura e moderna. Esqueça as notas de papel que rasgam ou somem; transforme seu celular em um banco digital completo.

---

## 🎯 Finalidade
Permitir que grupos de amigos joguem qualquer jogo que envolva dinheiro usando um sistema de "Fake PIX" e transações digitais, operando em uma rede local (Hotspot) sem necessidade de internet.

---

## ✨ Funcionalidades Principais

### 🏦 Para o Gerente (Banco)
*   **Controle Total:** Criação de mesas com saldos iniciais configuráveis.
*   **Gestão de PIN:** Visualização do PIN de entrada da mesa e PINs individuais dos jogadores.
*   **Modo Stealth (QR Global):** Ative ou desative as funções de QR Code de todos os jogadores com um clique.
*   **Dashboard Administrativo:** Interface dedicada para monitorar o caixa do banco e todas as movimentações.

### 👤 Para os Jogadores
*   **Login Persistente:** O sistema lembra sua mesa e seu acesso, evitando redigitação de PIN.
*   **Fake PIX (QR Code):** Pague e receba valores escaneando QRs, simulando a experiência de um banco real.
*   **Segurança em Duas Etapas:** PIN de entrada para a mesa e PIN pessoal de 4 dígitos para autorizar transferências.
*   **Histórico em Tempo Real:** Extrato detalhado de todas as suas entradas e saídas.

---

## 🛠️ Tecnologias
*   **Backend:** Python + Flask + SQLAlchemy (SQLite).
*   **Frontend:** React + Tailwind CSS (UI Moderna e Responsiva).
*   **Segurança:** PINs individuais e isolamento de sessões por mesa.
*   **Infra:** Preparado para rodar em rede local (0.0.0.0).

---

## 🚀 Como Instalar e Rodar

### 1. Requisitos
*   Python 3.10+
*   Node.js 18+

### 2. Configuração do Backend
```bash
cd backend
# Crie um ambiente virtual (opcional mas recomendado)
python -m venv venv
# No Windows:
.\venv\Scripts\activate
# Instale as dependências
pip install -r requirements.txt
# Inicie o servidor
python app.py
```

### 3. Configuração do Frontend
```bash
cd frontend
# Instale as dependências
npm install
# Gere o build de produção (para rodar rápido e offline)
npm run build
```

---

## 🧪 Como Testar

1.  **Inicie o Servidor:** Com o backend rodando, ele informará seu IP local (ex: `192.168.0.11:5000`).
2.  **Acesse no Navegador:** 
    *   No PC (Host): Acesse `localhost:5000`.
    *   No Celular: Conecte no mesmo Wi-Fi e acesse `http://SEU_IP:5000`.
3.  **Fluxo de Teste:**
    *   Crie uma mesa no PC. Anote o **PIN da Sala** (6 dígitos).
    *   No celular, escolha a mesa e digite o PIN.
    *   Logue com um jogador usando o **PIN Pessoal** (gerado automaticamente, visível no painel do Gerente).
    *   Tente fazer uma transferência e veja o modal de confirmação de segurança.
    *   Experimente desativar o **QR MODE** no PC e veja a função sumir no celular instantaneamente.

---

## 🧹 Manutenção
*   Para resetar todos os jogos e configurações: Delete o arquivo `backend/boardpay.db`.
*   O sistema limpa automaticamente sessões antigas quando uma mesa é deletada no servidor.

---

## 👨‍💻 Desenvolvedor
Projeto focado em UX Premium, Segurança Offline e Performance Mobile.
