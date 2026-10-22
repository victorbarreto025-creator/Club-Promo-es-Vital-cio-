#!/usr/bin/env bash
# Gera a pasta final para hospedagem (cópia dos arquivos estáticos; não há compilação).
# Uso: ./build.sh [pasta-de-saida]   (padrão: ../site-pronto-para-hospedar)
set -e
cd "$(dirname "$0")"
OUT="${1:-../site-pronto-para-hospedar}"
rm -rf "$OUT" && mkdir -p "$OUT"
cp -r index.html favicon.svg css js assets "$OUT"/
cp deploy/_headers "$OUT"/_headers
find "$OUT" -name ".gitkeep" -delete
echo "Pronto: $OUT"
