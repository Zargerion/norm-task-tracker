#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------------------
# pull-prod-db.sh — скачать дамп БД с прода и восстановить локально
#
# Использование:
#   ./scripts/pull-prod-db.sh
#
# Требования:
#   - SSH-доступ к серверу (ключ или агент)
#   - psql/pg_restore на локальной машине
#   - Локальная БД должна быть запущена (docker или нативный postgres)
#
# Переменные (переопределяй через окружение):
#   PROD_HOST, PROD_USER, PROD_PORT, PROD_SSH_KEY
#   PROD_APP_DIR, PROD_DB_CONTAINER
#   LOCAL_DB_URL
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.scripts"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

PROD_HOST="${PROD_HOST:-}"
PROD_USER="${PROD_USER:-}"
PROD_PORT="${PROD_PORT:-22}"
PROD_SSH_KEY="${PROD_SSH_KEY:-}"
PROD_APP_DIR="${PROD_APP_DIR:-}"
PROD_DB_CONTAINER="${PROD_DB_CONTAINER:-}"

LOCAL_DB_URL="${LOCAL_DB_URL:-}"

DUMP_FILE="/tmp/ntt-prod-$(date +%Y%m%d-%H%M%S).dump"

# ---------- валидация ----------

if [ -z "$PROD_HOST" ]; then
  echo "ERROR: укажи PROD_HOST. Пример:"
  echo "  PROD_HOST=1.2.3.4 ./scripts/pull-prod-db.sh"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $PROD_PORT"
[ -n "$PROD_SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $PROD_SSH_KEY"

echo "==> Подключаемся к $PROD_USER@$PROD_HOST..."
echo "==> Снимаем pg_dump внутри контейнера $PROD_DB_CONTAINER..."

ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" \
  "docker exec $PROD_DB_CONTAINER pg_dump -U postgres -Fc norm_task_tracker" \
  > "$DUMP_FILE"

echo "==> Дамп сохранён: $DUMP_FILE ($(du -sh "$DUMP_FILE" | cut -f1))"

echo "==> Восстанавливаем в локальную БД: $LOCAL_DB_URL..."

# Удаляем все объекты из локальной схемы перед восстановлением
psql "$LOCAL_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" > /dev/null

pg_restore --no-owner --no-privileges -d "$LOCAL_DB_URL" "$DUMP_FILE"

rm -f "$DUMP_FILE"

echo ""
echo "Готово. Данные с прода загружены в локальную БД."
