# pyright: reportUntypedFunctionDecorator=false

from flask import Flask, request, jsonify, Response
from typing import Tuple, Optional
from sqlalchemy.orm import joinedload

from database import db
from models import Jogo, Jogador, Transacao

from flask_cors import CORS

# 🔥 1. CRIA APP PRIMEIRO
app = Flask(__name__)


CORS(app)

# 🔥 2. CONFIGURAÇÃO
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///boardpay.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 🔥 3. INICIALIZA DB
db.init_app(app)

# 🔥 4. CRIA BANCO
with app.app_context():
    db.create_all()

# 🔥 5. ROTAS

@app.route('/')
def home():
    return {"mensagem": "BoardPay API rodando 🚀"}


@app.route('/jogos', methods=['POST'])
def criar_jogo() -> Tuple[Response, int]:
    session = db.session

    data = request.get_json(force=True)

    nome = data.get("nome")
    jogadores = data.get("jogadores")
    saldo_inicial = data.get("saldo_inicial")

    if not nome or not jogadores or saldo_inicial is None:
        return jsonify({"erro": "Dados inválidos"}), 400

    jogo_existente: Optional[Jogo] = Jogo.query.filter_by(nome=nome).first()

    if jogo_existente:
        return jsonify({"erro": "Já existe um jogo com esse nome"}), 400

    try:
        jogo = Jogo(nome=nome)
        session.add(jogo)
        session.flush()

        for nome_jogador in jogadores:
            jogador = Jogador(
                nome=nome_jogador,
                saldo=saldo_inicial,
                jogo_id=jogo.id
            )
            session.add(jogador)

        session.commit()

        return jsonify({
            "mensagem": "Jogo criado com sucesso",
            "jogo_id": jogo.id
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/jogos', methods=['GET'])
def listar_jogos():
    jogos = Jogo.query.all()

    return jsonify([
        {
            "id": jogo.id,
            "nome": jogo.nome,
            "data_criacao": jogo.data_criacao.isoformat() if jogo.data_criacao else None
        }
        for jogo in jogos
    ])

@app.route('/jogos/<int:jogo_id>', methods=['GET'])
def obter_jogo(jogo_id):
    jogo = Jogo.query.get(jogo_id)

    if not jogo:
        return jsonify({"erro": "Jogo não encontrado"}), 404

    return jsonify({
        "id": jogo.id,
        "nome": jogo.nome,
        "jogadores": [
            {
                "id": jogador.id,
                "nome": jogador.nome,
                "saldo": jogador.saldo
            }
            for jogador in jogo.jogadores
        ]
    })

@app.route('/transacoes', methods=['POST'])
def criar_transacao():
    data = request.json

    valor = data.get("valor")
    de_id = data.get("de_jogador_id")
    para_id = data.get("para_jogador_id")
    jogo_id = data.get("jogo_id")

    if not valor or not jogo_id:
        return jsonify({"erro": "Dados inválidos"}), 400

    session = db.session

    try:
        de_jogador = Jogador.query.get(de_id) if de_id else None
        para_jogador = Jogador.query.get(para_id) if para_id else None

        # 🔻 debita
        if de_jogador:
            if de_jogador.saldo < valor:
                return jsonify({"erro": "Saldo insuficiente"}), 400
            de_jogador.saldo -= valor

        # 🔺 credita
        if para_jogador:
            para_jogador.saldo += valor

        transacao = Transacao(
            valor=valor,
            de_jogador_id=de_id,
            para_jogador_id=para_id,
            jogo_id=jogo_id
        )

        session.add(transacao)
        session.commit()

        return jsonify({"mensagem": "Transação realizada com sucesso"}), 201

    except Exception as e:
        session.rollback()
        return jsonify({"erro": str(e)}), 500
    
@app.route('/jogos/<int:jogo_id>/transacoes', methods=['GET'])
def listar_transacoes(jogo_id):

    transacoes = Transacao.query\
        .options(
            joinedload(Transacao.de_jogador),
            joinedload(Transacao.para_jogador)
        )\
        .filter_by(jogo_id=jogo_id)\
        .order_by(Transacao.criado_em.desc())\
        .all()

    return jsonify([
        {
            "id": t.id,
            "valor": t.valor,
            "de": t.de_jogador.nome if t.de_jogador else "BANCO",
            "para": t.para_jogador.nome if t.para_jogador else "BANCO",
            "data": t.criado_em.isoformat() if t.criado_em else None
        }
        for t in transacoes
    ])




# 🔥 6. START
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)