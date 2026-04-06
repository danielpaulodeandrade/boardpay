# 🎲 BoardPay — Sistema de Gestão de Transações para Jogos

## 📌 Visão Geral

O **BoardPay** é uma aplicação fullstack desenvolvida com o objetivo de simular um sistema financeiro simplificado para jogos (ex: Banco Imobiliário), rodando em um servidor local acessível via Wi-Fi (hotspot), conhecido como servidor local offline via LAN (Local Network), permitindo:

- Criação de jogos
- Gerenciamento de jogadores
- Controle de saldo
- Transferências entre jogadores

O projeto foi construído com foco em:

- Arquitetura modular
- Boas práticas de backend e frontend
- Evolução futura para sistemas mais complexos (ex: IA, trading, automação)

---

## 🧱 Arquitetura

### 🔙 Backend (Python + Flask)

- Framework: Flask
- ORM: SQLAlchemy
- Banco: SQLite (dev)
- API REST

#### Estrutura:

```
backend/
 ├── app.py
 ├── models.py
 ├── database.py
 └── boardpay.db
```

---

### 🎨 Frontend (React)

- React (Create React App)
- Tailwind CSS (em configuração)
- Comunicação via Fetch API

#### Estrutura:

```
frontend/
 ├── src/
 │    ├── components/
 │    ├── pages/
 │    ├── services/
 │    ├── App.jsx
 │    └── index.css
```

---

## 🔌 Comunicação

- Frontend: http://localhost:3000

- Backend: http://localhost:5000

- Comunicação via REST API (JSON)

- CORS habilitado no backend

---

## 🧠 Modelagem de Dados

### 🟢 Jogo

- id
- nome
- data_criacao

### 🔵 Jogador

- id
- nome
- saldo
- jogo_id

### 🟣 Transacao

- id
- valor
- de_jogador_id
- para_jogador_id
- jogo_id
- criado_em

---

## 📡 Endpoints implementados

### 🎲 Jogos

#### Criar jogo

```
POST /jogos
```

Body:

```json
{
  "nome": "Banco Imobiliario"
}
```

---

#### Listar jogos

```
GET /jogos
```

Resposta:

```json
[
  {
    "id": 1,
    "nome": "Banco Imobiliario",
    "data_criacao": "2026-04-06T15:30:00"
  }
]
```

---

## ⚠️ Problemas encontrados (e resolvidos)

### ❌ CORS bloqueando requisições

✔️ Resolvido com `flask-cors`

---

### ❌ Datas inválidas no frontend (`Invalid Date`)

✔️ Causa: backend não retornava `data_criacao`
✔️ Solução: uso de `.isoformat()`

---

### ❌ Conflito de portas (3000)

✔️ Backend movido para porta 5000

---

### ❌ Problemas com dependências (React / Tailwind)

✔️ Reinstalação e fix de versões

---

## 🎨 UI Atual

A interface já possui:

- Layout dark moderno
- Lista de jogos
- Criação de jogos
- Estrutura preparada para:
  - Cards
  - Botões reutilizáveis
  - Design system

---

## 🚧 Em desenvolvimento

### 🔜 Próximas features

- Tela de detalhe do jogo
- Listagem de jogadores
- Transferências entre jogadores
- Saldo total consolidado
- Histórico de transações (extrato)

---

## 🚀 Roadmap futuro

### 🔥 Curto prazo

- UI estilo banco digital (Nubank-like)
- Modal de transferências
- Feedback visual (toasts)

---

### 🧠 Médio prazo

- Sistema de autenticação
- Multi-jogos simultâneos
- Persistência robusta (PostgreSQL)

---

### 🤖 Longo prazo

- Integração com IA
- Análise de comportamento financeiro
- Sistema de simulação e estratégia (base para trading AI)

---

## 🧪 Como rodar o projeto

### Backend

```bash
cd backend
python app.py
```

---

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 📌 Observações

- Projeto em fase inicial, porém com base sólida
- Código já estruturado para evolução
- Foco em aprendizado + portfólio + possível produto real

---

## 🤝 Objetivo do Review

Solicitamos análise do projeto considerando:

- Estrutura da arquitetura
- Organização do código
- Boas práticas aplicadas
- Possíveis melhorias
- Escalabilidade futura

---

## 👨‍💻 Autor

Projeto desenvolvido como parte de evolução técnica em:

- Fullstack development
- Arquitetura de sistemas
- Integração frontend/backend

---

## 💬 Status Atual

✔️ Backend funcional
✔️ API REST operante
✔️ Frontend integrado
✔️ Comunicação funcionando

🚧 UI em evolução
🚧 Funcionalidades avançadas em desenvolvimento

---
