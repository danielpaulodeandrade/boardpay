import hmac
import random
from typing import List, Dict

from domain.entities import Game, Player
from domain.ports.repositories import IGameRepository, IPlayerRepository
from domain.exceptions import ValidationError, ConflictError, NotFoundError, UnauthorizedError


class GameService:
    def __init__(self, game_repo: IGameRepository, player_repo: IPlayerRepository):
        self.game_repo = game_repo
        self.player_repo = player_repo

    def create_game(
        self,
        name: str,
        manager_password: str,
        bank_initial_balance: float,
        player_initial_balance: float,
        players_data: List[Dict],
    ) -> Dict:
        if not name or not manager_password or not players_data:
            raise ValidationError("Fill all required fields")

        if self.game_repo.get_by_name(name):
            raise ConflictError("A game with this name already exists")

        # Gera PIN único para o jogo
        while True:
            game_pin = str(random.randint(100000, 999999))
            if not self.game_repo.get_by_pin(game_pin):
                break

        game = Game(
            name=name,
            game_pin=game_pin,
            manager_password=manager_password,
            bank_balance=bank_initial_balance,
        )

        saved_game = self.game_repo.save(game)

        # Garante PINs únicos por jogador dentro do mesmo jogo
        used_pins: set = set()
        players = []
        for p_data in players_data:
            while True:
                personal_pin = str(random.randint(1000, 9999))
                if personal_pin not in used_pins:
                    used_pins.add(personal_pin)
                    break

            player = Player(
                name=p_data.get("name", "No Name"),
                avatar=p_data.get("avatar", "🐶"),
                personal_pin=personal_pin,
                balance=float(player_initial_balance),
                game_id=saved_game.id,
            )
            players.append(player)

        self.player_repo.save_all(players)

        return {
            "message": "Game created",
            "game_id": saved_game.id,
            "game_pin": saved_game.game_pin,
        }

    def list_games(self) -> List[Dict]:
        games = self.game_repo.get_all()
        return [
            {
                "id": g.id,
                "name": g.name,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in games
        ]

    def get_game_secure(self, game_id: int) -> Dict:
        game = self.game_repo.get_by_id(game_id)
        if not game:
            raise NotFoundError("Game not found")

        return {
            "id": game.id,
            "name": game.name,
            "bank_balance": game.bank_balance,
            "qr_enabled": game.qr_enabled,
            "players": [
                {"id": p.id, "name": p.name, "avatar": p.avatar, "balance": p.balance}
                for p in game.players
            ],
        }

    def get_admin_data(self, game_id: int, manager_password: str) -> Dict:
        game = self.game_repo.get_by_id(game_id)
        if not game or not hmac.compare_digest(
            str(game.manager_password), str(manager_password)
        ):
            raise UnauthorizedError("Unauthorized access")

        return {
            "general_pin": game.game_pin,
            "qr_enabled": game.qr_enabled,
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "avatar": p.avatar,
                    "balance": p.balance,
                    "personal_pin": p.personal_pin,
                }
                for p in game.players
            ],
        }

    def configure_game(
        self, game_id: int, manager_password: str, qr_enabled: bool
    ) -> Dict:
        game = self.game_repo.get_by_id(game_id)
        if not game or not hmac.compare_digest(
            str(game.manager_password), str(manager_password)
        ):
            raise UnauthorizedError("Invalid Authorization")

        if qr_enabled is not None:
            game.qr_enabled = bool(qr_enabled)
            self.game_repo.update(game)

        return {"message": "Settings updated", "qr_enabled": game.qr_enabled}
