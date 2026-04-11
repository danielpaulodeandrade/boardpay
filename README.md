# 🎲 BoardPay — Offline Digital Bank for Board Games

🌐 [English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md)

**BoardPay** is a complete digital financial system for board games like Monopoly. It works 100% offline via mobile hotspot — no internet, no paper money. Each player has their own balance, security PIN, and can pay via "Fake PIX" with QR Code.

---

## 🎯 Purpose

Replace physical money in board games with a real digital bank running on a local network (hotspot). The manager creates the table on the computer, players join from their phones and make secure transactions between each other — all in real time.

---

## ✨ Features

### 🏦 Manager (Bank)
- Create tables with configurable balances (bank + players)
- Admin dashboard with full control over balances and transactions
- View each player's PIN
- Global QR Code mode toggle (enable/disable for everyone)
- Invite via QR Code for new players to join the table
- Room PIN visible for easy sharing
- Multilingual (PT-BR, EN, ES)

### 👤 Players
- Persistent login (auto-login per session)
- Personal 4-digit PIN to authorize transfers
- Fake PIX: generate and scan QR Codes to pay/receive
- Real-time transaction history with inflows and outflows
- Direct transfers between players or to/from the bank
- Mobile-first interface optimized for smartphones

### 🔐 Security
- 6-digit PIN to enter a table (auto-generated, unique)
- Personal 4-digit PIN per player (unique per table, no collisions)
- PIN comparison using `hmac.compare_digest` (timing attack protection)
- Sessions isolated per table

---

## 🏛️ Architecture

The project follows **Hexagonal Architecture (Ports & Adapters)** with **SOLID** principles and **Clean Code**.

### Backend Structure

```
backend/
├── app.py                              # Composition Root + Error Handlers
├── domain/
│   ├── entities.py                     # Pure entities (dataclasses, zero dependencies)
│   ├── exceptions.py                   # Domain exceptions (ValidationError, NotFoundError, etc.)
│   └── ports/
│       └── repositories.py            # Abstract interfaces (ABCs) for repositories
├── application/
│   ├── game_service.py                # Use cases: game creation, admin, settings
│   ├── player_service.py             # Use cases: authentication (table, manager, player)
│   └── transaction_service.py        # Use cases: transfers and history
├── adapters/
│   ├── inbound/
│   │   └── http/
│   │       ├── game_routes.py         # Game HTTP routes (Flask Blueprint)
│   │       ├── auth_routes.py         # Authentication HTTP routes
│   │       └── transaction_routes.py  # Transaction HTTP routes
│   └── outbound/
│       └── repositories/
│           ├── game_repository.py     # SQLAlchemy implementation of IGameRepository
│           ├── player_repository.py   # SQLAlchemy implementation of IPlayerRepository
│           └── transaction_repository.py  # SQLAlchemy implementation of ITransactionRepository
└── infrastructure/
    ├── database.py                    # SQLAlchemy instance
    ├── models.py                      # ORM models (GameModel, PlayerModel, TransactionModel)
    └── unit_of_work.py               # @transactional decorator (centralized commit/rollback)
```

### Frontend Structure

```
frontend/src/
├── App.jsx                   # Main routing (React Router)
├── config.js                 # API URL configuration (auto-detect IP or custom override)
├── translations.js           # Internationalization (PT-BR, EN, ES)
├── pages/
│   ├── Games.jsx             # Table listing and creation
│   ├── GameDetail.jsx        # Main game screen (balance, PIX, history, admin)
│   └── InviteHandler.jsx     # QR Code invite handler
└── components/
    ├── TransferModal.jsx     # Transfer modal with PIN confirmation
    ├── Button.jsx            # Reusable button component
    ├── Card.jsx              # Reusable card component
    ├── JogadorCard.jsx       # Player card
    └── SaldoCard.jsx         # Balance card
```

### Data Flow

```
Browser → HTTP Adapter (Flask Routes) → Application Service → Domain (Entities + Ports)
                                                                      ↕
                                              Outbound Adapter (SQLAlchemy Repositories)
                                                                      ↕
                                                                   SQLite DB
```

**Applied principles:**
- The **domain** has no knowledge of Flask, SQLAlchemy, or HTTP — entities are pure `@dataclass`
- **Services** raise domain exceptions (never return HTTP status codes)
- **HTTP routes** use `@transactional` — never call `db.session.commit()` directly
- `app.py` maps domain exceptions → HTTP status via **global error handlers**
- Repositories convert Entity ↔ Model with `_to_entity()` / `_to_model()`

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Main language |
| Flask | 3.x | Web framework (REST API) |
| Flask-SQLAlchemy | 3.x | Database ORM |
| Flask-CORS | 5.x | Cross-origin request handling |
| SQLite | — | Database (local file, zero config) |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI library |
| React Router DOM | 7.x | SPA routing |
| Tailwind CSS | 3.x | Utility-first styling |
| qrcode.react | 4.x | QR Code generation |
| html5-qrcode | 2.x | QR Code reader via camera |

---

## 🚀 Installation

### Requirements
- Python 3.10+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/your-username/boardpay.git
cd boardpay
```

### 2. Backend
```bash
# Create and activate virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
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

## 📱 Android / Termux Deploy (Mobile Host)

You can turn your Android phone into the game server (Host) to share with friends via Hotspot without needing a computer.

1.  Install **Termux** on Android (preferably via F-Droid).
2.  Open Termux and prepare the environment:
    ```bash
    pkg update && pkg upgrade -y
    pkg install python git -y
    ```
3.  Clone the repository and enter the folder:
    ```bash
    git clone https://github.com/danielpaulodeandrade/boardpay.git
    cd boardpay
    ```
4.  Install dependencies and start the server:
    ```bash
    pip install -r backend/requirements.txt
    python backend/app.py
    ```
5.  Enable the phone's **Hotspot** and ask friends to connect to your Wi-Fi and access the IP shown in the terminal (e.g., `http://192.168.43.1:5000`).

---

## 📦 Portable Version (No Installation Required)


The easiest way to run BoardPay is to download the pre-built **`BoardPay.exe`** from the [GitHub Releases](https://github.com/danielpaulodeandrade/boardpay/releases) page.

### How to use
1. Download `BoardPay.exe` — place it **anywhere** (Downloads, Desktop, a USB drive, etc.).
2. Double-click to run — a terminal window will open showing your local network IP.
3. Access `http://localhost:5000` on the same machine, or `http://YOUR_IP:5000` on any mobile device connected via hotspot.

### Data persistence
The first time you run the EXE, it automatically creates an `instance/` folder **in the same directory as the EXE**, containing the `boardpay.db` database:

```
📁 Wherever BoardPay.exe lives
├── BoardPay.exe
└── instance/
    └── boardpay.db   ← created automatically on first run
```

> **Your game data persists** between sessions as long as `instance/` stays with `BoardPay.exe`.
> To back up or transfer your games, copy both `BoardPay.exe` **and** the `instance/` folder together.
> To start fresh, simply delete `instance/boardpay.db`.

---

## ▶️ How to Run (From Source)

### Production (Recommended for playing)
```bash
# From the project root, with venv activated:
python backend/app.py
```
Flask automatically serves the built frontend. Access:
- **PC:** `http://localhost:5000`
- **Mobile (via hotspot):** `http://YOUR_IP:5000` (the IP is shown in the terminal)

### Development (Frontend with hot-reload)
```bash
# Terminal 1 — Backend:
python backend/app.py

# Terminal 2 — Frontend dev server:
cd frontend
npm start
```
The frontend dev server runs on port 3000 and automatically points to the backend on port 5000.

### IP Configuration (optional)
If the system detects the wrong IP (e.g., a VPN IP), edit `frontend/src/config.js`:
```js
customApiUrl: "http://192.168.0.6:5000"  // Force the hotspot IP
```
Then run `npm run build` again.

---

## 🧪 How to Use

1. **Create a table** — On the PC, open the system and click "New Table". Set the name, manager password, player names and avatars, and initial balances.

2. **Share access** — The system generates a **6-digit PIN** for the room. Share it with players or use the **INVITE** button to generate a quick-access QR Code.

3. **Players connect** — On their phones, they access the IP via hotspot, select the table, and enter the room PIN. Then they select their avatar and enter their **personal 4-digit PIN** (visible to the manager in the admin panel).

4. **Transactions** — Players pay each other by tapping 💸 or generating/scanning "PIX" QR Codes. Every transfer requires confirmation with a personal PIN.

5. **Manager monitors** — The manager has a global view: bank balance, individual balances, complete history, and can toggle QR Code mode globally.

---

## 🧹 Maintenance

### Portable EXE
- **Reset data:** Delete `instance/boardpay.db` (next to the EXE) and restart.
- **Backup games:** Copy both `BoardPay.exe` and the `instance/` folder.

### From Source (Development)
- **Reset the database:** Delete `backend/instance/boardpay.db` and restart the server.
- **Force frontend rebuild:** `cd frontend && npm run build`
- **The database is created automatically** in `backend/instance/` on first run.

---

## 👨‍💻 Author

Project developed with a focus on **Premium UX**, **Offline Security**, and **Clean Architecture**.
