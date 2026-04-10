from infrastructure.database import db
from datetime import datetime, timezone

class GameModel(db.Model):
    __tablename__ = 'games'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    
    # 🔐 SEGURANÇA DO MUNDO
    game_pin = db.Column(db.String, nullable=False)  # PIN para participantes entrarem na partida
    manager_password = db.Column(db.String, nullable=False) # Senha para o Gerente do Banco acessar o painel adm

    bank_balance = db.Column(db.Float, default=100000.0)
    qr_enabled = db.Column(db.Boolean, default=False) # Controle global de QR Code/Fake PIX
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    players = db.relationship('PlayerModel', backref='game_ref', lazy=True)
    transactions = db.relationship('TransactionModel', backref='game_ref', lazy=True)

class PlayerModel(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    avatar = db.Column(db.String, nullable=True, default='avatar1')
    personal_pin = db.Column(db.String, nullable=False) # PIN individual de cada jogador (ex: 1234)
    balance = db.Column(db.Float, nullable=False)

    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)

class TransactionModel(db.Model):
    __tablename__ = "transactions"

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    type = db.Column(db.String, default='transfer')

    from_player_id = db.Column(db.Integer, db.ForeignKey('players.id'))
    to_player_id = db.Column(db.Integer, db.ForeignKey('players.id'))

    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    from_player = db.relationship('PlayerModel', foreign_keys=[from_player_id])
    to_player = db.relationship('PlayerModel', foreign_keys=[to_player_id])
