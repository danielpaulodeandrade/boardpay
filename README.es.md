# 🎲 BoardPay — Banco Digital Offline para Juegos de Mesa

🌐 [English](README.md) · [Português](README.pt-BR.md) · [Español](README.es.md)

**BoardPay** es un sistema financiero digital completo para juegos de mesa como Monopoly. Funciona 100% offline a través del hotspot del celular — sin internet, sin billetes de papel. Cada jugador tiene su propio saldo, PIN de seguridad y puede pagar con "PIX Falso" mediante QR Code.

---

## 🎯 Propósito

Reemplazar el dinero físico en juegos de mesa por un banco digital real, funcionando en la red local (hotspot). El gerente crea la mesa en la computadora, los jugadores acceden desde sus celulares y realizan transacciones entre sí con seguridad — todo en tiempo real.

---

## ✨ Funcionalidades

### 🏦 Gerente (Banco)
- Creación de mesas con saldos configurables (banco + jugadores)
- Panel administrativo con control total de saldos y movimientos
- Visualización de los PINs de cada jugador
- Control global del modo QR Code (activar/desactivar para todos)
- Invitación vía QR Code para que nuevos jugadores se unan a la mesa
- PIN de la sala visible para compartir
- Multilingüe (PT-BR, EN, ES)

### 👤 Jugadores
- Login persistente (auto-login por sesión)
- PIN personal de 4 dígitos para autorizar transferencias
- PIX Falso: generar y escanear QR Codes para pagar/recibir
- Historial de transacciones en tiempo real con entradas y salidas
- Transferencia directa entre jugadores o hacia/desde el banco
- Interfaz mobile-first optimizada para smartphones

### 🔐 Seguridad
- PIN de 6 dígitos para entrar a la mesa (generado automáticamente, único)
- PIN personal de 4 dígitos por jugador (único por mesa, sin colisiones)
- Comparación de PINs con `hmac.compare_digest` (protección contra timing attacks)
- Sesiones aisladas por mesa

---

## 🏛️ Arquitectura

El proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)** con principios **SOLID** y **Clean Code**.

### Estructura del Backend

```
backend/
├── app.py                              # Composition Root + Error Handlers
├── domain/
│   ├── entities.py                     # Entidades puras (dataclasses, cero dependencias)
│   ├── exceptions.py                   # Excepciones de dominio (ValidationError, NotFoundError, etc.)
│   └── ports/
│       └── repositories.py            # Interfaces abstractas (ABCs) de los repositorios
├── application/
│   ├── game_service.py                # Casos de uso: creación de juegos, admin, configuraciones
│   ├── player_service.py             # Casos de uso: autenticación (mesa, gerente, jugador)
│   └── transaction_service.py        # Casos de uso: transferencias e historial
├── adapters/
│   ├── inbound/
│   │   └── http/
│   │       ├── game_routes.py         # Rutas HTTP de juegos (Blueprint Flask)
│   │       ├── auth_routes.py         # Rutas HTTP de autenticación
│   │       └── transaction_routes.py  # Rutas HTTP de transacciones
│   └── outbound/
│       └── repositories/
│           ├── game_repository.py     # Implementación SQLAlchemy de IGameRepository
│           ├── player_repository.py   # Implementación SQLAlchemy de IPlayerRepository
│           └── transaction_repository.py  # Implementación SQLAlchemy de ITransactionRepository
└── infrastructure/
    ├── database.py                    # Instancia de SQLAlchemy
    ├── models.py                      # Modelos ORM (GameModel, PlayerModel, TransactionModel)
    └── unit_of_work.py               # Decorator @transactional (commit/rollback centralizado)
```

### Estructura del Frontend

```
frontend/src/
├── App.jsx                   # Enrutamiento principal (React Router)
├── config.js                 # Configuración de API URL (auto-detección de IP o personalización)
├── translations.js           # Internacionalización (PT-BR, EN, ES)
├── pages/
│   ├── Games.jsx             # Listado y creación de mesas
│   ├── GameDetail.jsx        # Pantalla principal del juego (saldo, PIX, historial, admin)
│   └── InviteHandler.jsx     # Handler de invitación vía QR Code
└── components/
    ├── TransferModal.jsx     # Modal de transferencia con confirmación por PIN
    ├── Button.jsx            # Componente de botón reutilizable
    ├── Card.jsx              # Componente de tarjeta reutilizable
    ├── JogadorCard.jsx       # Tarjeta de jugador
    └── SaldoCard.jsx         # Tarjeta de saldo
```

### Flujo de Datos

```
Browser → HTTP Adapter (Flask Routes) → Application Service → Domain (Entities + Ports)
                                                                      ↕
                                              Outbound Adapter (SQLAlchemy Repositories)
                                                                      ↕
                                                                   SQLite DB
```

**Principios aplicados:**
- El **dominio** no conoce Flask, SQLAlchemy ni HTTP — las entidades son `@dataclass` puras
- Los **services** lanzan excepciones de dominio (nunca retornan códigos de estado HTTP)
- Las **rutas HTTP** usan `@transactional` — nunca llaman a `db.session.commit()` directamente
- `app.py` mapea excepciones de dominio → estado HTTP mediante **global error handlers**
- Los repositorios convierten Entity ↔ Model con `_to_entity()` / `_to_model()`

---

## 🛠️ Tecnologías

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.10+ | Lenguaje principal |
| Flask | 3.x | Framework web (API REST) |
| Flask-SQLAlchemy | 3.x | ORM para base de datos |
| Flask-CORS | 5.x | Permitir solicitudes cross-origin |
| SQLite | — | Base de datos (archivo local, cero configuración) |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.x | Biblioteca de UI |
| React Router DOM | 7.x | Enrutamiento SPA |
| Tailwind CSS | 3.x | Estilización utility-first |
| qrcode.react | 4.x | Generación de QR Codes |
| html5-qrcode | 2.x | Lectura de QR Code vía cámara |

---

## 🚀 Cómo Instalar

### Requisitos
- Python 3.10+
- Node.js 18+

### 1. Clona el repositorio
```bash
git clone https://github.com/tu-usuario/boardpay.git
cd boardpay
```

### 2. Backend
```bash
# Crea y activa el entorno virtual
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instala las dependencias
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

## 📦 Versión Portátil (Sin Necesidad de Instalación)

La forma más sencilla de usar BoardPay es descargar el **`BoardPay.exe`** precompilado desde la página de [GitHub Releases](https://github.com/danielpaulodeandrade/boardpay/releases).

### Cómo usar
1. Descarga `BoardPay.exe` y colócalo **en cualquier lugar** (Descargas, Escritorio, pendrive, etc.).
2. Haz doble clic para ejecutar — se abrirá una ventana de terminal mostrando la IP de tu red local.
3. Accede a `http://localhost:5000` en la misma máquina, o a `http://TU_IP:5000` en cualquier celular conectado por hotspot.

### Persistencia de datos
En la primera ejecución, el sistema crea automáticamente una carpeta `instance/` **en el mismo directorio donde está el `.exe`**, con la base de datos `boardpay.db` dentro:

```
📁 Donde esté BoardPay.exe
├── BoardPay.exe
└── instance/
    └── boardpay.db   ← creado automáticamente en la primera ejecución
```

> **Tus datos persisten** entre sesiones mientras la carpeta `instance/` esté junto al `BoardPay.exe`.
> Para hacer una copia de seguridad o transferir tus partidas, copia el `BoardPay.exe` **y** la carpeta `instance/` juntos.
> Para empezar desde cero, simplemente elimina `instance/boardpay.db`.

---

## ▶️ Cómo Ejecutar (Desde el código fuente)

### Producción (Recomendado para jugar)
```bash
# Desde la raíz del proyecto, con el venv activado:
python backend/app.py
```
Flask sirve el frontend compilado automáticamente. Accede desde:
- **PC:** `http://localhost:5000`
- **Celulares (vía hotspot):** `http://TU_IP:5000` (la IP aparece en la terminal)

### Desarrollo (Frontend con hot-reload)
```bash
# Terminal 1 — Backend:
python backend/app.py

# Terminal 2 — Frontend dev server:
cd frontend
npm start
```
El frontend dev corre en el puerto 3000 y apunta automáticamente al backend en el puerto 5000.

### Configuración de IP (opcional)
Si el sistema detecta la IP incorrecta (ej: IP de VPN), edita `frontend/src/config.js`:
```js
customApiUrl: "http://192.168.0.6:5000"  // Forzar la IP del hotspot
```
Luego ejecuta `npm run build` nuevamente.

---

## 🧪 Cómo Usar

1. **Crea una mesa** — En la PC, abre el sistema y haz clic en "Nueva Mesa". Define el nombre, contraseña del gerente, nombres y avatares de los jugadores, y saldos iniciales.

2. **Comparte el acceso** — El sistema genera un **PIN de 6 dígitos** para la sala. Compártelo con los jugadores o usa el botón **INVITAR** para generar un QR Code de acceso rápido.

3. **Los jugadores se conectan** — Desde el celular, acceden a la IP vía hotspot, eligen la mesa e ingresan el PIN de la sala. Luego, seleccionan su avatar e ingresan el **PIN personal de 4 dígitos** (visible para el gerente en el panel admin).

4. **Transacciones** — Los jugadores se pagan entre sí tocando 💸 o generando/escaneando QR Codes de "PIX". Toda transferencia requiere confirmación con PIN personal.

5. **El gerente monitorea** — El gerente tiene visión global: saldo del banco, saldos individuales, historial completo, y puede activar/desactivar el modo QR Code globalmente.

---

## 🧹 Mantenimiento

### Versión Portátil (.exe)
- **Resetear datos:** Elimina `instance/boardpay.db` (carpeta junto al .exe) y reinicia.
- **Copia de seguridad:** Copia el `BoardPay.exe` y la carpeta `instance/` juntos.

### Desde el código fuente (Desarrollo)
- **Resetear la base de datos:** Elimina `backend/instance/boardpay.db` y reinicia el servidor.
- **Forzar rebuild del frontend:** `cd frontend && npm run build`
- **La base de datos se crea automáticamente** en `backend/instance/` en la primera ejecución.

---

## 👨‍💻 Autor

Proyecto desarrollado con enfoque en **UX Premium**, **Seguridad Offline** y **Arquitectura Limpia**.
