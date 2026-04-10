from typing import List, Optional
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from domain.entities import Transaction
from domain.ports.repositories import ITransactionRepository
from infrastructure.database import db
from infrastructure.models import TransactionModel

class TransactionRepository(ITransactionRepository):
    
    def _to_entity(self, model: TransactionModel) -> Transaction:
        if not model:
            return None
        t = Transaction(
            id=model.id,
            amount=model.amount,
            type=model.type,
            from_player_id=model.from_player_id,
            to_player_id=model.to_player_id,
            game_id=model.game_id,
            created_at=model.created_at
        )
        if model.from_player:
            t.from_player_name = model.from_player.name
        if model.to_player:
            t.to_player_name = model.to_player.name
        return t

    def _to_model(self, entity: Transaction) -> TransactionModel:
        if not entity:
            return None
        model = TransactionModel(
            amount=entity.amount,
            type=entity.type,
            from_player_id=entity.from_player_id,
            to_player_id=entity.to_player_id,
            game_id=entity.game_id,
            created_at=entity.created_at
        )
        if entity.id:
            model.id = entity.id
        return model

    def save(self, transaction: Transaction) -> Transaction:
        model = self._to_model(transaction)
        db.session.add(model)
        db.session.flush()
        return self._to_entity(model)

    def get_by_game_id(self, game_id: int) -> List[Transaction]:
        models = TransactionModel.query.options(
            joinedload(TransactionModel.from_player), 
            joinedload(TransactionModel.to_player)
        ).filter_by(game_id=game_id).order_by(TransactionModel.created_at.desc()).all()
        return [self._to_entity(m) for m in models]

    def get_by_game_and_player(self, game_id: int, player_id: int) -> List[Transaction]:
        models = TransactionModel.query.options(
            joinedload(TransactionModel.from_player), 
            joinedload(TransactionModel.to_player)
        ).filter_by(game_id=game_id).filter(
            or_(TransactionModel.from_player_id == player_id, TransactionModel.to_player_id == player_id)
        ).order_by(TransactionModel.created_at.desc()).all()
        return [self._to_entity(m) for m in models]
