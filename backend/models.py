from database import db
from datetime import datetime, timezone

# 🟢 JOGO
class Jogo(db.Model):
    __tablename__ = 'jogos'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String, unique=True, nullable=False)
    
    # 🔐 SEGURANÇA DO MUNDO
    pin_jogo = db.Column(db.String, nullable=False)  # PIN para participantes entrarem na partida
    senha_gerente = db.Column(db.String, nullable=False) # Senha para o Gerente do Banco acessar o painel adm

    saldo_banco = db.Column(db.Float, default=100000.0)
    qr_enabled = db.Column(db.Boolean, default=True) # Controle global de QR Code/Fake PIX
    data_criacao = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    jogadores = db.relationship('Jogador', backref='jogo', lazy=True)
    transacoes = db.relationship('Transacao', backref='jogo', lazy=True)


# 🔵 JOGADOR
class Jogador(db.Model):
    __tablename__ = 'jogadores'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String, nullable=False)
    avatar = db.Column(db.String, nullable=True, default='avatar1')
    pin_pessoal = db.Column(db.String, nullable=False) # PIN individual de cada jogador (ex: 1234)
    saldo = db.Column(db.Float, nullable=False)

    jogo_id = db.Column(db.Integer, db.ForeignKey('jogos.id'), nullable=False)


# 🟣 TRANSACAO
class Transacao(db.Model):
    __tablename__ = "transacoes"

    id = db.Column(db.Integer, primary_key=True)
    valor = db.Column(db.Float, nullable=False)
    tipo = db.Column(db.String, default='transfer')

    de_jogador_id = db.Column(db.Integer, db.ForeignKey('jogadores.id'))
    para_jogador_id = db.Column(db.Integer, db.ForeignKey('jogadores.id'))

    jogo_id = db.Column(db.Integer, db.ForeignKey('jogos.id'), nullable=False)

    criado_em = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    de_jogador = db.relationship('Jogador', foreign_keys=[de_jogador_id])
    para_jogador = db.relationship('Jogador', foreign_keys=[para_jogador_id])