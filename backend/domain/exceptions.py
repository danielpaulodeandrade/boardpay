"""
Domain exceptions — sem dependência de nenhum framework.
Os adapters (HTTP) mapeiam essas exceções para status codes HTTP.
"""


class DomainException(Exception):
    """Exceção base para todos os erros de domínio."""
    pass


class ValidationError(DomainException):
    """Dados de entrada inválidos ou regra de negócio violada."""
    pass


class NotFoundError(DomainException):
    """Entidade não encontrada."""
    pass


class UnauthorizedError(DomainException):
    """Autenticação falhou (credencial incorreta)."""
    pass


class ConflictError(DomainException):
    """Conflito — recurso já existe."""
    pass


class InsufficientBalanceError(DomainException):
    """Saldo insuficiente para a operação."""
    pass
