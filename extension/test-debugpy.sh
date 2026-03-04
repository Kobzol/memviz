#!/usr/bin/env bash
set -euo pipefail

EXT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEBUGPY_DIR="${EXT_DIR}/static/scripts/debugpy"
VENV_DIR="${DEBUGPY_DIR}/.venv"
REQUIREMENTS_FILE="${DEBUGPY_DIR}/requirements-test.txt"
TEST_FILE="${DEBUGPY_DIR}/test.py"

if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
  echo "[debugpy-test] Creating virtual environment in ${VENV_DIR}"
  python3 -m venv "${VENV_DIR}"
fi

# shellcheck disable=SC1091
source "${VENV_DIR}/bin/activate"

echo "[debugpy-test] Installing test requirements"
python -m pip install --disable-pip-version-check -r "${REQUIREMENTS_FILE}"

echo "[debugpy-test] Running pytest"
python -m pytest "${TEST_FILE}"
