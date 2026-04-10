from flask import Blueprint, request, jsonify

from application.transaction_service import TransactionService
from infrastructure.unit_of_work import transactional


def create_transaction_routes(transaction_service: TransactionService) -> Blueprint:
    bp = Blueprint("transaction_routes", __name__)

    @bp.route("/transactions", methods=["POST"])
    @transactional
    def create_transaction():
        data = request.json
        result = transaction_service.create_transaction(
            game_id=data.get("game_id"),
            amount=float(data.get("amount", 0)),
            from_id=data.get("from_player_id"),
            to_id=data.get("to_player_id"),
            personal_pin=data.get("personal_pin"),
        )
        return jsonify(result), 201

    @bp.route("/games/<int:game_id>/transactions", methods=["GET"])
    def list_transactions(game_id):
        return jsonify(
            transaction_service.list_transactions(
                game_id, request.args.get("player_id")
            )
        )

    return bp
