from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional

@dataclass
class Player:
    name: str
    personal_pin: str
    balance: float
    game_id: int
    avatar: str = '🐶'
    id: Optional[int] = None

@dataclass
class Transaction:
    amount: float
    game_id: int
    from_player_id: Optional[int] = None
    to_player_id: Optional[int] = None
    type: str = 'transfer'
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: Optional[int] = None
    from_player_name: Optional[str] = None
    to_player_name: Optional[str] = None

@dataclass
class Game:
    name: str
    game_pin: str
    manager_password: str
    bank_balance: float = 100000.0
    qr_enabled: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    id: Optional[int] = None
    players: List[Player] = field(default_factory=list)
