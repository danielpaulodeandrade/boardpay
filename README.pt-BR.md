# 🎲 BoardPay — Banco Digital Offline para Jogos de Tabuleiro

🌐 [English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md)

O **BoardPay** é um sistema financeiro digital completo para jogos de tabuleiro como Banco Imobiliário. Funciona 100% offline via hotspot do celular — sem internet, sem notas de papel. Cada jogador tem seu próprio saldo, PIN de segurança e pode pagar via "Fake PIX" com QR Code.

---

## 🎯 Propósito

Substituir o dinheiro físico de jogos de tabuleiro por um banco digital real, rodando na rede local (hotspot). O gerente cria a mesa no computador, os jogadores acessam pelo celular e fazem transações entre si com segurança — tudo em tempo real.

---

## ✨ Funcionalidades

### 🏦 Gerente (Banco)
- Criação de mesas com saldos configuráveis (banco + jogadores)
- Painel administrativo com controle total de saldos e movimentações
- Visualização dos PINs de cada jogador
- Controle global do modo QR Code (liga/desliga para todos)
- Convite via QR Code para novos jogadores entrarem na mesa
- PIN da sala visível para compartilhar
- Multilíngue (PT-BR, EN, ES)

### 👤 Jogadores
- Login persistente (auto-login por sessão)
- PIN pessoal de 4 dígitos para autorizar transferências
- Fake PIX: gerar e escanear QR Code para pagar/receber
- Extrato em tempo real com entradas e saídas
- Transferência direta entre jogadores ou para o banco
- Interface mobile-first otimizada para celular

### 🔐 Segurança
- PIN de 6 dígitos para entrar na mesa (gerado automaticamente, único)
- PIN pessoal de 4 dígitos por jogador (único por mesa, sem colisão)
- Comparação de PINs com `hmac.compare_digest` (proteção contra timing attacks)
- Sessões isoladas por mesa

---

## 🏛️ Arquitetura

O projeto segue **Arquitetura Hexagonal (Ports & Adapters)** com princípios **SOLID** e **Clean Code**.

### Estrutura do Backend

```
backend/
├── app.py                              # Composition Root + Error Handlers
├── domain/
│   ├── entities.py                     # Entidades puras (dataclasses, zero dependências)
│   ├── exceptions.py                   # Exceções de domínio (ValidationError, NotFoundError, etc.)
│   └── ports/
│       └── repositories.py            # Interfaces abstratas (ABCs) dos repositórios
├── application/
│   ├── game_service.py                # Casos de uso: criação de jogos, admin, configurações
│   ├── player_service.py             # Casos de uso: autenticação (mesa, gerente, jogador)
│   └── transaction_service.py        # Casos de uso: transferências e histórico
├── adapters/
│   ├── inbound/
│   │   └── http/
│   │       ├── game_routes.py         # Rotas HTTP de jogos (Blueprint Flask)
│   │       ├── auth_routes.py         # Rotas HTTP de autenticação
│   │       └── transaction_routes.py  # Rotas HTTP de transações
│   └── outbound/
│       └── repositories/
│           ├── game_repository.py     # Implementação SQLAlchemy do IGameRepository
│           ├── player_repository.py   # Implementação SQLAlchemy do IPlayerRepository
│           └── transaction_repository.py  # Implementação SQLAlchemy do ITransactionRepository
└── infrastructure/
    ├── database.py                    # Instância do SQLAlchemy
    ├── models.py                      # Modelos ORM (GameModel, PlayerModel, TransactionModel)
    └── unit_of_work.py               # Decorator @transactional (commit/rollback centralizado)
```

### Estrutura do Frontend

```
frontend/src/
├── App.jsx                   # Roteamento principal (React Router)
├── config.js                 # Configuração de API URL (auto-detect IP ou customização)
├── translations.js           # Internacionalização (PT-BR, EN, ES)
├── pages/
│   ├── Games.jsx             # Listagem e criação de mesas
│   ├── GameDetail.jsx        # Tela principal do jogo (saldo, PIX, histórico, admin)
│   └── InviteHandler.jsx     # Handler de convite via QR Code
└── components/
    ├── TransferModal.jsx     # Modal de transferência com confirmação por PIN
    ├── Button.jsx            # Componente de botão reutilizável
    ├── Card.jsx              # Componente de card reutilizável
    ├── JogadorCard.jsx       # Card de jogador
    └── SaldoCard.jsx         # Card de saldo
```

### Fluxo de Dados

```
Browser → HTTP Adapter (Flask Routes) → Application Service → Domain (Entities + Ports)
                                                                      ↕
                                              Outbound Adapter (SQLAlchemy Repositories)
                                                                      ↕
                                                                   SQLite DB
```

**Princípios aplicados:**
- O **domínio** não conhece Flask, SQLAlchemy nem HTTP — entidades são `@dataclass` puras
- Os **services** lançam exceções de domínio (nunca retornam status code HTTP)
- As **rotas HTTP** usam `@transactional` — nunca fazem `db.session.commit()` diretamente
- O `app.py` mapeia exceções de domínio → status HTTP via **global error handlers**
- Repositórios convertem Entity ↔ Model com `_to_entity()` / `_to_model()`

---

## 🛠️ Tecnologias

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.10+ | Linguagem principal |
| Flask | 3.x | Framework web (API REST) |
| Flask-SQLAlchemy | 3.x | ORM para banco de dados |
| Flask-CORS | 5.x | Permitir requisições cross-origin |
| SQLite | — | Banco de dados (arquivo local, zero config) |

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.x | Biblioteca de UI |
| React Router DOM | 7.x | Roteamento SPA |
| Tailwind CSS | 3.x | Estilização utility-first |
| qrcode.react | 4.x | Geração de QR Codes |
| html5-qrcode | 2.x | Leitura de QR Code via câmera |

---

## 🚀 Como Instalar

### Requisitos
- Python 3.10+
- Node.js 18+

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/boardpay.git
cd boardpay
```

### 2. Backend
```bash
# Crie e ative o ambiente virtual
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instale as dependências
pip install -r backend/requirements.txt
```

### 3. Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

---

## 📦 Versão Portátil (Sem Necessidade de Instalação)

A forma mais simples de usar o BoardPay é baixar o **`BoardPay.exe`** pré-compilado na página de [GitHub Releases](https://github.com/danielpaulodeandrade/boardpay/releases).

### Como usar
1. Baixe o `BoardPay.exe` e coloque-o **em qualquer lugar** (Downloads, Área de Trabalho, pendrive, etc.).
2. Dê dois cliques para executar — uma janela de terminal vai abrir mostrando o IP da sua rede local.
3. Acesse `http://localhost:5000` na mesma máquina, ou `http://SEU_IP:5000` em qualquer celular conectado via hotspot.

### Persistência dos dados
Na primeira execução, o sistema cria automaticamente uma pasta `instance/` **no mesmo diretório onde o `.exe` está**, contendo o banco de dados `boardpay.db`:

```
📁 Onde o BoardPay.exe estiver
├── BoardPay.exe
└── instance/
    └── boardpay.db   ← criado automaticamente na primeira execução
```

> **Seus dados persistem** entre sessões enquanto a pasta `instance/` estiver junto ao `BoardPay.exe`.
> Para fazer backup ou transferir suas partidas, copie o `BoardPay.exe` **e** a pasta `instance/` juntos.
> Para começar do zero, basta apagar o `instance/boardpay.db`.

---

## ▶️ Como Rodar (A partir do código-fonte)

### Produção (Recomendado para jogar)
```bash
# Na raiz do projeto, com o venv ativado:
python backend/app.py
```
O Flask serve o frontend buildado automaticamente. Acesse:
- **PC:** `http://localhost:5000`
- **Celulares (via hotspot):** `http://SEU_IP:5000` (o IP aparece no terminal)

### Desenvolvimento (Frontend com hot-reload)
```bash
# Terminal 1 — Backend:
python backend/app.py

# Terminal 2 — Frontend dev server:
cd frontend
npm start
```
O frontend dev roda na porta 3000 e aponta automaticamente para o backend na porta 5000.

### Configuração de IP (opcional)
Se o sistema pegar o IP errado (ex: IP da VPN), edite `frontend/src/config.js`:
```js
customApiUrl: "http://192.168.0.6:5000"  // Forçar o IP do hotspot
```
Depois faça `npm run build` novamente.

---

## 🧪 Como Usar

1. **Crie uma mesa** — No PC, acesse o sistema e clique em "Nova Mesa". Defina o nome, senha do gerente, nomes e avatares dos jogadores, e saldos iniciais.

2. **Compartilhe o acesso** — O sistema gera um **PIN de 6 dígitos** para a sala. Compartilhe com os jogadores ou use o botão **CONVIDAR** para gerar um QR Code de acesso rápido.

3. **Jogadores se conectam** — No celular, acessam o IP via hotspot, escolhem a mesa e digitam o PIN da sala. Depois, selecionam seu avatar e digitam o **PIN pessoal de 4 dígitos** (visível para o gerente no painel admin).

4. **Transações** — Jogadores pagam uns aos outros clicando em 💸 ou gerando/lendo QR Codes de "PIX". Toda transferência exige confirmação com PIN pessoal.

5. **Gerente monitora** — O gerente tem visão global: saldo do banco, saldos individuais, histórico completo, e pode ligar/desligar o modo QR Code globalmente.

---

## 🧹 Manutenção

### Versão Portátil (.exe)
- **Resetar dados:** Apague `instance/boardpay.db` (pasta ao lado do .exe) e reinicie.
- **Fazer backup:** Copie o `BoardPay.exe` e a pasta `instance/` juntos.

### A partir do código-fonte (Desenvolvimento)
- **Resetar o banco:** Delete `backend/instance/boardpay.db` e reinicie o servidor.
- **Forçar rebuild do frontend:** `cd frontend && npm run build`
- **O banco é criado automaticamente** em `backend/instance/` na primeira execução.

---

## 👨‍💻 Autor

Projeto desenvolvido com foco em **UX Premium**, **Segurança Offline** e **Arquitetura Limpa**.
