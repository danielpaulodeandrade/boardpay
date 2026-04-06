from database import db
from datetime import datetime, timezone

# 🟢 JOGO
class Jogo(db.Model):
    __tablename__ = 'jogos'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String, unique=True, nullable=False)
    data_criacao = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    jogadores = db.relationship('Jogador', backref='jogo', lazy=True)
    transacoes = db.relationship('Transacao', backref='jogo', lazy=True)


# 🔵 JOGADOR
class Jogador(db.Model):
    __tablename__ = 'jogadores'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String, nullable=False)
    saldo = db.Column(db.Integer, nullable=False)

    jogo_id = db.Column(db.Integer, db.ForeignKey('jogos.id'), nullable=False)


# 🟣 TRANSACAO
class Transacao(db.Model):
    __tablename__ = "transacoes"

    id = db.Column(db.Integer, primary_key=True)

    valor = db.Column(db.Float, nullable=False)

    de_jogador_id = db.Column(db.Integer, db.ForeignKey('jogadores.id'))
    para_jogador_id = db.Column(db.Integer, db.ForeignKey('jogadores.id'))

    jogo_id = db.Column(db.Integer, db.ForeignKey('jogos.id'), nullable=False)

    criado_em = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # 🔥 RELACIONAMENTOS
    de_jogador = db.relationship('Jogador', foreign_keys=[de_jogador_id])
    para_jogador = db.relationship('Jogador', foreign_keys=[para_jogador_id])