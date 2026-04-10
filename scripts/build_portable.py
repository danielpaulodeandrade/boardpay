#!/usr/bin/env python3
"""
BoardPay - Portable Build Script
Gera um unico BoardPay.exe com o backend Python e frontend React embutidos.

Uso:
    python scripts/build_portable.py
"""

import subprocess
import sys
import os
import shutil
from pathlib import Path

# ─── Diretorios ────────────────────────────────────────────────────────────────
ROOT_DIR     = Path(__file__).parent.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR  = ROOT_DIR / "backend"
SCRIPTS_DIR  = ROOT_DIR / "scripts"
DIST_DIR     = ROOT_DIR / "dist"

ICON_PNG = FRONTEND_DIR / "public" / "logo192.png"
ICON_ICO = SCRIPTS_DIR / "boardpay.ico"

# ─── Helpers ───────────────────────────────────────────────────────────────────

def run(cmd, cwd=None):
    """Executa um comando e exibe o que esta rodando.
    shell=True e necessario no Windows para resolver .cmd (npm.cmd, etc)."""
    display = " ".join(str(c) for c in cmd)
    print(f"\n🔨  {display}")
    subprocess.run(cmd, cwd=cwd, check=True, shell=(sys.platform == "win32"))


def ensure_pip_package(import_name: str, pip_name: str = None):
    """Instala um pacote pip se nao estiver disponivel."""
    pip_name = pip_name or import_name
    try:
        __import__(import_name)
    except ImportError:
        print(f"   📦 Instalando {pip_name}...")
        run([sys.executable, "-m", "pip", "install", pip_name])


# ─── Etapas do Build ───────────────────────────────────────────────────────────

def convert_icon():
    """Converte logo192.png → boardpay.ico (PyInstaller exige .ico no Windows)."""
    print("\n🎨  Convertendo ícone PNG → ICO...")
    if not ICON_PNG.exists():
        print(f"   ⚠️  Ícone não encontrado em {ICON_PNG}. Continuando sem ícone.")
        return None

    ensure_pip_package("PIL", "Pillow")
    from PIL import Image

    img = Image.open(ICON_PNG).convert("RGBA")
    img.save(
        ICON_ICO,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    print(f"   ✅ Ícone salvo em: {ICON_ICO}")
    return ICON_ICO


def build_frontend():
    """Compila o React para gerar frontend/build."""
    print("\n⚛️   Compilando frontend React...")
    run(["npm", "run", "build"], cwd=FRONTEND_DIR)
    print("   ✅ Frontend compilado!")


def clean_previous_build():
    """Remove artefatos de builds anteriores para evitar conflitos."""
    for folder in ["build", "dist", "__pycache__"]:
        target = ROOT_DIR / folder
        if target.exists():
            print(f"   🗑  Removendo {target}...")
            shutil.rmtree(target)

    spec_file = ROOT_DIR / "BoardPay.spec"
    if spec_file.exists():
        spec_file.unlink()


def build_exe(icon_path):
    """Executa o PyInstaller para gerar o BoardPay.exe."""
    print("\n📦  Empacotando com PyInstaller...")
    ensure_pip_package("PyInstaller", "pyinstaller")

    frontend_build = FRONTEND_DIR / "build"

    # No Windows: separador é ";" para --add-data
    add_data_sep = ";" if sys.platform == "win32" else ":"
    add_data_frontend = f"{frontend_build}{add_data_sep}frontend/build"

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",                          # Um único .exe
        "--console",                          # Mantém terminal aberto (ver IP e logs)
        "--name", "BoardPay",
        "--add-data", add_data_frontend,      # Inclui o build React dentro do .exe
        "--paths", str(BACKEND_DIR),          # Resolve imports relativos do backend
        # Hidden imports para SQLAlchemy/Flask que PyInstaller pode perder
        "--hidden-import", "sqlalchemy.dialects.sqlite",
        "--hidden-import", "flask_cors",
        "--hidden-import", "engineio.async_drivers.threading",
        # Ponto de entrada
        str(BACKEND_DIR / "app.py"),
    ]

    if icon_path and icon_path.exists():
        cmd += ["--icon", str(icon_path)]

    run(cmd, cwd=ROOT_DIR)


def report_result():
    """Mostra o caminho e tamanho do .exe gerado."""
    exe_path = DIST_DIR / "BoardPay.exe"
    if exe_path.exists():
        size_mb = exe_path.stat().st_size / (1024 * 1024)
        print("\n" + "=" * 60)
        print("  🚀  BoardPay.exe gerado com sucesso!")
        print(f"  📁  {exe_path}")
        print(f"  📊  Tamanho: {size_mb:.1f} MB")
        print("=" * 60)
        print("\nComo usar:")
        print("  1. Copie a pasta dist/ para qualquer notebook Windows.")
        print("  2. Execute BoardPay.exe com duplo clique.")
        print("  3. Acesse http://localhost:5000 no navegador.")
        print("  4. O banco de dados será criado em instance/boardpay.db")
        print("     na mesma pasta do .exe.\n")
    else:
        print("\n❌  BoardPay.exe não foi gerado. Veja o log do PyInstaller acima.")
        sys.exit(1)


# ─── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  BoardPay — Portable Build Script")
    print("=" * 60)

    clean_previous_build()
    icon_path = convert_icon()
    build_frontend()
    build_exe(icon_path)
    report_result()
