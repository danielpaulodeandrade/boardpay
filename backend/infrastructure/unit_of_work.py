"""
Unit of Work — decorator @transactional para os adapters HTTP.

Centraliza a lógica de commit/rollback do banco de dados.
Os adapters inbound usam esse decorator; os services nunca chamam commit diretamente.
"""

from functools import wraps
from infrastructure.database import db


def transactional(f):
    """
    Decorator que envolve um handler de rota em uma transação de banco de dados.
    - Sucesso → commit automático
    - Exceção → rollback automático + re-raise (para os error handlers do Flask)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            result = f(*args, **kwargs)
            db.session.commit()
            return result
        except Exception:
            db.session.rollback()
            raise

    return decorated_function
