from typing import List, Optional
from domain.entities import Player
from domain.ports.repositories import IPlayerRepository
from infrastructure.database import db
from infrastructure.models import PlayerModel

class PlayerRepository(IPlayerRepository):
    
    def _to_entity(self, model: PlayerModel) -> Player:
        if not model:
            return None
        return Player(
            id=model.id,
            name=model.name,
            personal_pin=model.personal_pin,
            balance=model.balance,
            game_id=model.game_id,
            avatar=model.avatar
        )

    def _to_model(self, entity: Player) -> PlayerModel:
        if not entity:
            return None
        model = PlayerModel(
            name=entity.name,
            personal_pin=entity.personal_pin,
            balance=entity.balance,
            game_id=entity.game_id,
            avatar=entity.avatar
        )
        if entity.id:
            model.id = entity.id
        return model

    def save(self, player: Player) -> Player:
        model = self._to_model(player)
        db.session.add(model)
        db.session.flush()
        return self._to_entity(model)

    def save_all(self, players: List[Player]) -> List[Player]:
        models = [self._to_model(j) for j in players]
        for m in models:
            db.session.add(m)
        db.session.flush()
        return [self._to_entity(m) for m in models]

    def get_by_id(self, player_id: int) -> Optional[Player]:
        model = db.session.get(PlayerModel, player_id)
        return self._to_entity(model)

    def get_by_id_and_game_id(self, player_id: int, game_id: int) -> Optional[Player]:
        model = PlayerModel.query.filter_by(id=player_id, game_id=game_id).first()
        return self._to_entity(model)
        
    def update(self, player: Player) -> Player:
        model = db.session.get(PlayerModel, player.id)
        if model:
            model.name = player.name
            model.personal_pin = player.personal_pin
            model.balance = player.balance
            model.avatar = player.avatar
            db.session.flush()
        return self._to_entity(model)
