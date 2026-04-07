# pyright: reportUntypedFunctionDecorator=false

from flask import Flask, request, jsonify, Response
from typing import Tuple, Optional
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
import random

from database import db
from models import Jogo, Jogador, Transacao

from flask_cors import CORS

import os
app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')

CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///boardpay.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    try: return app.send_static_file('index.html')
    except Exception: return {"mensagem": "BoardPay API rodando 🚀 (Mas o Frontend ainda não foi 'buildado')"}

@app.errorhandler(404)
def not_found(e):
    try:
        if request.path.startswith('/api/'): return jsonify({"erro": "Rota de API não encontrada"}), 404
        return app.send_static_file('index.html')
    except Exception: return {"erro": "Rota não encontrada e Frontend não embutido."}, 404


@app.route('/jogos', methods=['POST'])
def criar_jogo() -> Tuple[Response, int]:
    session = db.session
    data = request.get_json(force=True)

    nome = data.get("nome")
    senha_gerente = data.get("senha_gerente") # Senha admin
    
    jogadores = data.get("jogadores")
    saldo_inicial_jog = data.get("saldo_inicial_jogador")
    saldo_inicial_banco = data.get("saldo_inicial_banco", 100000)

    if not nome or not senha_gerente or not jogadores:
        return jsonify({"erro": "Preencha todos os campos obrigatórios"}), 400

    if Jogo.query.filter_by(nome=nome).first():
        return jsonify({"erro": "Já existe um jogo com esse nome"}), 400

    try:
        # 🎲 Geração automática de PIN de mesa único (6 dígitos)
        pin_jogo = str(random.randint(100000, 999999))
        while Jogo.query.filter_by(pin_jogo=pin_jogo).first():
            pin_jogo = str(random.randint(100000, 999999))

        jogo = Jogo(nome=nome, pin_jogo=pin_jogo, senha_gerente=senha_gerente, saldo_banco=saldo_inicial_banco)
        session.add(jogo)
        session.flush()

        for jog_data in jogadores:
            # PIN Individual aleatório de 4 dígitos para cada conta
            pin_pessoal = str(random.randint(1000, 9999))
            jogador = Jogador(
                nome=jog_data.get("nome", "Sem Nome"),
                avatar=jog_data.get("avatar", "🐶"),
                pin_pessoal=pin_pessoal,
                saldo=float(saldo_inicial_jog),
                jogo_id=jogo.id
            )
            session.add(jogador)

        session.commit()
        return jsonify({"mensagem": "Jogo criado", "jogo_id": jogo.id, "pin_jogo": jogo.pin_jogo}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/jogos', methods=['GET'])
def listar_jogos():
    jogos = Jogo.query.all()
    return jsonify([{
        "id": j.id, "nome": j.nome, 
        "data_criacao": j.data_criacao.isoformat() if j.data_criacao else None
    } for j in jogos])

# Rota para entrar no jogo (Poder de Usuário/Convidado)
@app.route('/jogos/entrar', methods=['POST'])
def entrar_no_jogo():
    data = request.json
    jogo_id = data.get("jogo_id")
    pin_entrada = data.get("pin_entrada") # PIN de entrada do jogo
    
    jogo = Jogo.query.get(jogo_id)
    if jogo:
        if jogo.pin_jogo == str(pin_entrada):
            return jsonify({"status": "ok", "perm": "player"}), 200
    return jsonify({"erro": "PIN de entrada do jogo incorreto"}), 401

# Rota de Login Admin (Gerente)
@app.route('/login-gerente', methods=['POST'])
def login_gerente():
    data = request.json
    jogo_id = data.get("jogo_id")
    senha_gerente = data.get("senha_gerente")
    
    jogo = Jogo.query.get(jogo_id)
    if jogo and jogo.senha_gerente == str(senha_gerente):
        return jsonify({"status": "ok", "perm": "manager"}), 200
    return jsonify({"erro": "Senha do Gerente incorreta"}), 401


@app.route('/jogos/<int:jogo_id>', methods=['GET'])
def obter_jogo(jogo_id):
    jogo = Jogo.query.get(jogo_id)
    if not jogo: return jsonify({"erro": "Não localizado"}), 404
    
    # IMPORTANTE: No modo "obter_jogo" comum, não retornamos os PINs pessoais. 
    # Somente o Gerente (outro endpoint futuramente) teria acesso a isso se necessário.
    return jsonify({
        "id": jogo.id, "nome": jogo.nome, "saldo_banco": jogo.saldo_banco,
        "qr_enabled": jogo.qr_enabled, # 🟢 Sincronização global
        "jogadores": [{
            "id": j.id, "nome": j.nome, "avatar": j.avatar, "saldo": j.saldo
        } for j in jogo.jogadores]
    })

# Obter dados sensíveis (Só o Gerente deve usar)
@app.route('/jogos/<int:jogo_id>/admin', methods=['POST'])
def admin_obter_dados(jogo_id):
    data = request.json
    senha_gerente = data.get("senha_gerente")
    
    jogo = Jogo.query.get(jogo_id)
    if jogo and jogo.senha_gerente == str(senha_gerente):
        return jsonify({
            "pin_geral": jogo.pin_jogo,
            "qr_enabled": jogo.qr_enabled,
            "jogadores": [{
                "id": j.id, "nome": j.nome, "avatar": j.avatar, "saldo": j.saldo, "pin_pessoal": j.pin_pessoal
            } for j in jogo.jogadores]
        }), 200
    return jsonify({"erro": "Acesso não autorizado"}), 403

# 🛠️ NOVA ROTA: Configurações Globais (Só Gerente)
@app.route('/jogos/<int:jogo_id>/config', methods=['POST'])
def configurar_jogo(jogo_id):
    data = request.get_json(force=True)
    senha_gerente = data.get("senha_gerente")
    qr_enabled = data.get("qr_enabled")

    jogo = Jogo.query.get(jogo_id)
    if not jogo or jogo.senha_gerente != str(senha_gerente):
        return jsonify({"erro": "Autorização Inválida"}), 403
    
    if qr_enabled is not None:
        jogo.qr_enabled = bool(qr_enabled)
        db.session.commit()
    
    return jsonify({"mensagem": "Configurações atualizadas", "qr_enabled": jogo.qr_enabled}), 200

# Login Pessoal com PIN do Jogador
@app.route('/login', methods=['POST'])
def login_jogador():
    data = request.json
    jogo_id = data.get("jogo_id")
    jogador_id = data.get("jogador_id")
    pin_pessoal = data.get("pin_pessoal")

    jogador = Jogador.query.filter_by(id=jogador_id, jogo_id=jogo_id).first()
    if jogador and jogador.pin_pessoal == str(pin_pessoal):
        return jsonify({"status": "ok", "jogador_id": jogador.id, "nome": jogador.nome}), 200
    return jsonify({"erro": "Seu PIN Pessoal está incorreto"}), 401

@app.route('/transacoes', methods=['POST'])
def criar_transacao():
    data = request.json
    valor = float(data.get("valor", 0))
    de_id = data.get("de_jogador_id")
    para_id = data.get("para_jogador_id")
    jogo_id = data.get("jogo_id")
    pin_pessoal = data.get("pin_pessoal") # Opcional se for banco, obrigatório se for jogador
    
    if valor <= 0 or not jogo_id: return jsonify({"erro": "Invalido"}), 400

    session = db.session
    try:
        jogo = Jogo.query.get(jogo_id)
        if de_id:
            de_jog = Jogador.query.get(de_id)
            # 🛡️ VALIDAÇÃO DE SEGURANÇA (PIN)
            if not de_jog or de_jog.pin_pessoal != str(pin_pessoal):
                return jsonify({"erro": "PIN pessoal incorreto para autorizar a transferência"}), 401
            
            if de_jog.saldo < valor: return jsonify({"erro": "Sem saldo"}), 400
            de_jog.saldo -= valor
        else:
            if jogo.saldo_banco < valor: return jsonify({"erro": "Sem saldo"}), 400
            jogo.saldo_banco -= valor

        if para_id:
            para_jog = Jogador.query.get(para_id)
            para_jog.saldo += valor
        else: jogo.saldo_banco += valor

        transacao = Transacao(valor=valor, de_jogador_id=de_id, para_jogador_id=para_id, jogo_id=jogo_id)
        session.add(transacao)
        session.commit()
        return jsonify({"mensagem": "OK"}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"erro": str(e)}), 500

@app.route('/jogos/<int:jogo_id>/transacoes', methods=['GET'])
def listar_transacoes(jogo_id):
    de_id = request.args.get('jogador_id')
    query = Transacao.query.options(joinedload(Transacao.de_jogador), joinedload(Transacao.para_jogador)).filter_by(jogo_id=jogo_id)
    if de_id: query = query.filter(or_(Transacao.de_jogador_id == de_id, Transacao.para_jogador_id == de_id))
    transacoes = query.order_by(Transacao.criado_em.desc()).all()
    return jsonify([{
        "id": t.id, "valor": t.valor, "de": t.de_jogador.nome if t.de_jogador else "BANCO",
        "para": t.para_jogador.nome if t.para_jogador else "BANCO", "data": t.criado_em.isoformat()
    } for t in transacoes])

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)