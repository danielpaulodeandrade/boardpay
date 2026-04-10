from flask import Blueprint, request, jsonify

from application.player_service import PlayerService


def create_auth_routes(player_service: PlayerService) -> Blueprint:
    bp = Blueprint("auth_routes", __name__)

    @bp.route("/games/enter", methods=["POST"])
    def enter_game():
        data = request.json
        result = player_service.authenticate_game_entry(
            data.get("game_id"), data.get("entry_pin")
        )
        return jsonify(result)

    @bp.route("/login-manager", methods=["POST"])
    def login_manager():
        data = request.json
        result = player_service.authenticate_manager(
            data.get("game_id"), data.get("manager_password")
        )
        return jsonify(result)

    @bp.route("/login", methods=["POST"])
    def login_player():
        data = request.json
        result = player_service.authenticate_player(
            data.get("game_id"), data.get("player_id"), data.get("personal_pin")
        )
        return jsonify(result)

    return bp
