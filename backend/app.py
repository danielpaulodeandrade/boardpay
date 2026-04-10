from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

from infrastructure.database import db
from adapters.outbound.repositories.game_repository import GameRepository
from adapters.outbound.repositories.player_repository import PlayerRepository
from adapters.outbound.repositories.transaction_repository import TransactionRepository
from application.game_service import GameService
from application.player_service import PlayerService
from application.transaction_service import TransactionService
from adapters.inbound.http.game_routes import create_game_routes
from adapters.inbound.http.auth_routes import create_auth_routes
from adapters.inbound.http.transaction_routes import create_transaction_routes
from domain.exceptions import (
    DomainException,
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ConflictError,
    InsufficientBalanceError,
)


def _get_assets_base() -> str:
    """
    Returns the base directory for read-only assets (frontend/build).
    - Bundled (.exe): PyInstaller extracts assets to sys._MEIPASS (temp dir).
    - Development: relative to this file (backend/).
    """
    if getattr(sys, "frozen", False):
        return sys._MEIPASS  # type: ignore[attr-defined]
    return os.path.dirname(os.path.abspath(__file__))


def _get_instance_dir() -> str:
    """
    Returns the directory for mutable data (SQLite database).
    - Bundled (.exe): next to the .exe so data persists across runs.
    - Development: backend/instance/ as usual.
    """
    if getattr(sys, "frozen", False):
        return os.path.join(os.path.dirname(sys.executable), "instance")
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(backend_dir, "instance")


def create_app() -> Flask:
    _base = _get_assets_base()
    _instance_path = _get_instance_dir()

    app = Flask(
        __name__,
        instance_path=_instance_path,
        static_folder=os.path.join(_base, "frontend", "build"),
        static_url_path="/",
    )
    CORS(app)

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///boardpay.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Garante que a pasta instance existe
    os.makedirs(_instance_path, exist_ok=True)

    db.init_app(app)

    with app.app_context():
        db.create_all()
        print(f"✅ Database initialized at: {os.path.join(app.instance_path, 'boardpay.db')}")

    # --- Composition Root: Wire up dependencies ---

    # 1. Repositories (outbound adapters)
    game_repo = GameRepository()
    player_repo = PlayerRepository()
    transaction_repo = TransactionRepository()

    # 2. Application services
    game_service = GameService(game_repo, player_repo)
    player_service = PlayerService(game_repo, player_repo)
    transaction_service = TransactionService(game_repo, player_repo, transaction_repo)

    # 3. HTTP Blueprints (inbound adapters)
    game_bp = create_game_routes(game_service)
    auth_bp = create_auth_routes(player_service)
    transaction_bp = create_transaction_routes(transaction_service)

    app.register_blueprint(game_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(transaction_bp)

    # --- Global Domain Exception → HTTP Mapping ---
    # O domínio lança exceções, os handlers aqui as convertem para respostas HTTP.
    # Os services e routes nunca precisam conhecer status codes.

    @app.errorhandler(ValidationError)
    def handle_validation_error(e: ValidationError):
        return jsonify({"error": str(e)}), 400

    @app.errorhandler(ConflictError)
    def handle_conflict_error(e: ConflictError):
        return jsonify({"error": str(e)}), 409

    @app.errorhandler(NotFoundError)
    def handle_not_found_error(e: NotFoundError):
        return jsonify({"error": str(e)}), 404

    @app.errorhandler(UnauthorizedError)
    def handle_unauthorized_error(e: UnauthorizedError):
        return jsonify({"error": str(e)}), 401

    @app.errorhandler(InsufficientBalanceError)
    def handle_insufficient_balance_error(e: InsufficientBalanceError):
        return jsonify({"error": str(e)}), 400

    @app.errorhandler(DomainException)
    def handle_generic_domain_error(e: DomainException):
        return jsonify({"error": "Internal domain error"}), 500

    # --- Frontend Serving ---

    @app.route("/")
    def home():
        try:
            return app.send_static_file("index.html")
        except Exception:
            return jsonify({"message": "BoardPay API running 🚀 (Frontend build missing)"})

    @app.errorhandler(404)
    def not_found(e):
        try:
            if request.path.startswith("/api/"):
                return jsonify({"error": "API Route not found"}), 404
            return app.send_static_file("index.html")
        except Exception:
            return jsonify({"error": "Route not found and Frontend static missing."}), 404

    return app


app = create_app()

if __name__ == "__main__":
    # debug=False when bundled: reloader causes issues with PyInstaller
    is_dev = not getattr(sys, "frozen", False)
    app.run(debug=is_dev, host="0.0.0.0", port=5000)