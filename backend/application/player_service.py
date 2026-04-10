import hmac
from typing import Dict

from domain.ports.repositories import IGameRepository, IPlayerRepository
from domain.exceptions import UnauthorizedError


class PlayerService:
    def __init__(self, game_repo: IGameRepository, player_repo: IPlayerRepository):
        self.game_repo = game_repo
        self.player_repo = player_repo

    def authenticate_game_entry(self, game_id: int, entry_pin: str) -> Dict:
        game = self.game_repo.get_by_id(game_id)
        if not game or not hmac.compare_digest(str(game.game_pin), str(entry_pin)):
            raise UnauthorizedError("Incorrect game entry PIN")
        return {"status": "ok", "perm": "player"}

    def authenticate_manager(self, game_id: int, manager_password: str) -> Dict:
        game = self.game_repo.get_by_id(game_id)
        if not game or not hmac.compare_digest(
            str(game.manager_password), str(manager_password)
        ):
            raise UnauthorizedError("Incorrect Manager Password")
        return {"status": "ok", "perm": "manager"}

    def authenticate_player(
        self, game_id: int, player_id: int, personal_pin: str
    ) -> Dict:
        player = self.player_repo.get_by_id_and_game_id(player_id, game_id)
        if not player or not hmac.compare_digest(
            str(player.personal_pin), str(personal_pin)
        ):
            raise UnauthorizedError("Incorrect Personal PIN")
        return {"status": "ok", "player_id": player.id, "name": player.name}
