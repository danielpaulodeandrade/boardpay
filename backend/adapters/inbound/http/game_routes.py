from flask import Blueprint, request, jsonify

from application.game_service import GameService
from infrastructure.unit_of_work import transactional


def create_game_routes(game_service: GameService) -> Blueprint:
    bp = Blueprint("game_routes", __name__)

    @bp.route("/games", methods=["POST"])
    @transactional
    def create_game():
        data = request.get_json(force=True)
        result = game_service.create_game(
            name=data.get("name"),
            manager_password=data.get("manager_password"),
            bank_initial_balance=data.get("bank_initial_balance", 100000),
            player_initial_balance=data.get("player_initial_balance"),
            players_data=data.get("players"),
        )
        return jsonify(result), 201

    @bp.route("/games", methods=["GET"])
    def list_games():
        return jsonify(game_service.list_games())

    @bp.route("/games/<int:game_id>", methods=["GET"])
    def get_game(game_id):
        return jsonify(game_service.get_game_secure(game_id))

    @bp.route("/games/<int:game_id>/admin", methods=["POST"])
    def admin_get_data(game_id):
        data = request.json
        return jsonify(game_service.get_admin_data(game_id, data.get("manager_password")))

    @bp.route("/games/<int:game_id>/config", methods=["POST"])
    @transactional
    def configure_game(game_id):
        data = request.get_json(force=True)
        result = game_service.configure_game(
            game_id,
            data.get("manager_password"),
            data.get("qr_enabled"),
        )
        return jsonify(result)

    return bp
