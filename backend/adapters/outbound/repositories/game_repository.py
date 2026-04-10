from typing import List, Optional
from domain.entities import Game, Player
from domain.ports.repositories import IGameRepository
from infrastructure.database import db
from infrastructure.models import GameModel

class GameRepository(IGameRepository):
    
    def _to_entity(self, model: GameModel) -> Game:
        if not model:
            return None
        players = []
        if model.players:
            for j in model.players:
                players.append(Player(
                    id=j.id,
                    name=j.name,
                    personal_pin=j.personal_pin,
                    balance=j.balance,
                    game_id=j.game_id,
                    avatar=j.avatar
                ))
        return Game(
            id=model.id,
            name=model.name,
            game_pin=model.game_pin,
            manager_password=model.manager_password,
            bank_balance=model.bank_balance,
            qr_enabled=model.qr_enabled,
            created_at=model.created_at,
            players=players
        )

    def _to_model(self, entity: Game) -> GameModel:
        if not entity:
            return None
        model = GameModel(
            name=entity.name,
            game_pin=entity.game_pin,
            manager_password=entity.manager_password,
            bank_balance=entity.bank_balance,
            qr_enabled=entity.qr_enabled
        )
        if entity.id:
            model.id = entity.id
        return model

    def save(self, game: Game) -> Game:
        model = self._to_model(game)
        db.session.add(model)
        db.session.flush() # ensure ID is generated
        saved = self._to_entity(model)
        return saved
        
    def get_by_id(self, game_id: int) -> Optional[Game]:
        model = db.session.get(GameModel, game_id)
        return self._to_entity(model)

    def get_by_name(self, name: str) -> Optional[Game]:
        model = GameModel.query.filter_by(name=name).first()
        return self._to_entity(model)

    def get_by_pin(self, game_pin: str) -> Optional[Game]:
        model = GameModel.query.filter_by(game_pin=game_pin).first()
        return self._to_entity(model)

    def get_all(self) -> List[Game]:
        models = GameModel.query.all()
        return [self._to_entity(m) for m in models]
        
    def update(self, game: Game) -> Game:
        model = db.session.get(GameModel, game.id)
        if model:
            model.name = game.name
            model.game_pin = game.game_pin
            model.manager_password = game.manager_password
            model.bank_balance = game.bank_balance
            model.qr_enabled = game.qr_enabled
            db.session.flush()
        return self._to_entity(model)
