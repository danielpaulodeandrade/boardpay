from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities import Game, Player, Transaction

class IGameRepository(ABC):
    @abstractmethod
    def save(self, game: Game) -> Game:
        pass

    @abstractmethod
    def get_by_id(self, game_id: int) -> Optional[Game]:
        pass

    @abstractmethod
    def get_by_name(self, name: str) -> Optional[Game]:
        pass

    @abstractmethod
    def get_by_pin(self, game_pin: str) -> Optional[Game]:
        pass
        
    @abstractmethod
    def get_all(self) -> List[Game]:
        pass
        
    @abstractmethod
    def update(self, game: Game) -> Game:
        pass


class IPlayerRepository(ABC):
    @abstractmethod
    def save(self, player: Player) -> Player:
        pass

    @abstractmethod
    def save_all(self, players: List[Player]) -> List[Player]:
        pass
        
    @abstractmethod
    def get_by_id(self, player_id: int) -> Optional[Player]:
        pass

    @abstractmethod
    def get_by_id_and_game_id(self, player_id: int, game_id: int) -> Optional[Player]:
        pass
        
    @abstractmethod
    def update(self, player: Player) -> Player:
        pass


class ITransactionRepository(ABC):
    @abstractmethod
    def save(self, transaction: Transaction) -> Transaction:
        pass

    @abstractmethod
    def get_by_game_id(self, game_id: int) -> List[Transaction]:
        pass

    @abstractmethod
    def get_by_game_and_player(self, game_id: int, player_id: int) -> List[Transaction]:
        pass
