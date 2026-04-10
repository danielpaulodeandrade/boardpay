import hmac
from typing import Dict, List

from domain.entities import Transaction
from domain.ports.repositories import (
    IGameRepository,
    IPlayerRepository,
    ITransactionRepository,
)
from domain.exceptions import (
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    InsufficientBalanceError,
)


class TransactionService:
    def __init__(
        self,
        game_repo: IGameRepository,
        player_repo: IPlayerRepository,
        transaction_repo: ITransactionRepository,
    ):
        self.game_repo = game_repo
        self.player_repo = player_repo
        self.transaction_repo = transaction_repo

    def create_transaction(
        self,
        game_id: int,
        amount: float,
        from_id: int = None,
        to_id: int = None,
        personal_pin: str = None,
    ) -> Dict:
        if amount <= 0 or not game_id:
            raise ValidationError("Invalid input")

        game = self.game_repo.get_by_id(game_id)
        if not game:
            raise NotFoundError("Game not found")

        # Validar e debitar do remetente
        if from_id:
            from_player = self.player_repo.get_by_id(from_id)
            if not from_player or not hmac.compare_digest(
                str(from_player.personal_pin), str(personal_pin)
            ):
                raise UnauthorizedError("Incorrect personal PIN to authorize transfer")

            if from_player.balance < amount:
                raise InsufficientBalanceError("Insufficient balance")

            from_player.balance -= amount
            self.player_repo.update(from_player)
        else:
            # Remetente é o banco
            if game.bank_balance < amount:
                raise InsufficientBalanceError("Insufficient bank balance")
            game.bank_balance -= amount
            self.game_repo.update(game)

        # Creditar no destinatário
        if to_id:
            to_player = self.player_repo.get_by_id(to_id)
            if not to_player:
                raise NotFoundError("Recipient not found")
            to_player.balance += amount
            self.player_repo.update(to_player)
        else:
            # Destinatário é o banco
            game.bank_balance += amount
            self.game_repo.update(game)

        transaction = Transaction(
            amount=amount,
            from_player_id=from_id,
            to_player_id=to_id,
            game_id=game_id,
        )
        self.transaction_repo.save(transaction)

        return {"message": "OK"}

    def list_transactions(self, game_id: int, player_id: int = None) -> List[Dict]:
        if player_id:
            transactions = self.transaction_repo.get_by_game_and_player(
                game_id, int(player_id)
            )
        else:
            transactions = self.transaction_repo.get_by_game_id(game_id)

        return [
            {
                "id": t.id,
                "amount": t.amount,
                "from": t.from_player_name if t.from_player_name else "BANK",
                "to": t.to_player_name if t.to_player_name else "BANK",
                "date": t.created_at.isoformat() if t.created_at else None,
            }
            for t in transactions
        ]
