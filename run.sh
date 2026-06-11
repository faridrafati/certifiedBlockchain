#!/usr/bin/env bash
# ============================================================
#  CertifiedBlockchain DApp launcher (Linux / macOS)
#
#  Usage:
#    ./run.sh            - start the Vite dev server (default)
#    ./run.sh dev        - start the Vite dev server
#    ./run.sh build      - production build into dist/
#    ./run.sh preview    - serve the production build locally
#    ./run.sh compile    - compile Solidity contracts (hardHat)
#    ./run.sh node       - start a local Hardhat blockchain node
#    ./run.sh help       - show this help
#
#  First time: chmod +x run.sh
# ============================================================
set -euo pipefail

# Always run from the directory this script lives in
cd "$(dirname "$0")"

usage() {
    cat <<'EOF'

CertifiedBlockchain DApp launcher

  ./run.sh            start the Vite dev server (default)
  ./run.sh dev        start the Vite dev server
  ./run.sh build      production build into dist/
  ./run.sh preview    serve the production build locally
  ./run.sh compile    compile Solidity contracts (hardHat)
  ./run.sh node       start a local Hardhat blockchain node
  ./run.sh help       show this help

EOF
}

# --- Check prerequisites -----------------------------------
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not on PATH." >&2
    echo "        Download it from https://nodejs.org/" >&2
    exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
    echo "[ERROR] npm is not installed or not on PATH." >&2
    exit 1
fi

ensure_frontend_deps() {
    if [ ! -d "node_modules" ]; then
        echo "[INFO] Installing frontend dependencies..."
        npm install --no-audit --no-fund
    fi
}

ensure_hardhat_deps() {
    if [ ! -d "hardHat/node_modules" ]; then
        echo "[INFO] Installing Hardhat dependencies..."
        (cd hardHat && npm install --no-audit --no-fund)
    fi
}

CMD="${1:-dev}"

case "$CMD" in
    dev)
        ensure_frontend_deps
        echo "[INFO] Starting Vite dev server on http://localhost:3000 ..."
        npm run dev
        ;;
    build)
        ensure_frontend_deps
        echo "[INFO] Building production bundle into dist/ ..."
        npm run build
        ;;
    preview)
        ensure_frontend_deps
        echo "[INFO] Serving production build (run './run.sh build' first) ..."
        npm run preview
        ;;
    compile)
        ensure_hardhat_deps
        echo "[INFO] Compiling Solidity contracts..."
        (cd hardHat && npx hardhat compile)
        ;;
    node)
        ensure_hardhat_deps
        echo "[INFO] Starting local Hardhat node on http://127.0.0.1:8545 ..."
        (cd hardHat && npx hardhat node)
        ;;
    help|-h|--help)
        usage
        ;;
    *)
        echo "[ERROR] Unknown command: $CMD" >&2
        usage
        exit 1
        ;;
esac
