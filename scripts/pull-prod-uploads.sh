#!/usr/bin/env bash
set -e

# ---------------------------------------------------------------------------
# pull-prod-uploads.sh — скачать папку uploads с прода и положить локально
#
# Использование:
#   ./scripts/pull-prod-uploads.sh
#
# Требования:
#   - SSH-доступ к серверу (ключ или агент)
#   - rsync на локальной и удалённой машинах (или tar+ssh fallback)
#
# Переменные (переопределяй через окружение или .env.scripts):
#   PROD_HOST, PROD_USER, PROD_PORT, PROD_SSH_KEY
#   PROD_APP_DIR, PROD_BACKEND_CONTAINER
#   LOCAL_UPLOADS_DIR
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env.scripts"
[ -f "$ENV_FILE" ] && set -a && source "$ENV_FILE" && set +a

PROD_HOST="${PROD_HOST:-}"
PROD_USER="${PROD_USER:-}"
PROD_PORT="${PROD_PORT:-22}"
PROD_SSH_KEY="${PROD_SSH_KEY:-}"
PROD_APP_DIR="${PROD_APP_DIR:-}"
PROD_BACKEND_CONTAINER="${PROD_BACKEND_CONTAINER:-}"

# Куда класть файлы локально (относительно корня проекта)
LOCAL_UPLOADS_DIR="${LOCAL_UPLOADS_DIR:-$SCRIPT_DIR/../backend/uploads}"

# ---------- валидация ----------

if [ -z "$PROD_HOST" ]; then
  echo "ERROR: укажи PROD_HOST. Пример:"
  echo "  PROD_HOST=1.2.3.4 ./scripts/pull-prod-uploads.sh"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p $PROD_PORT"
[ -n "$PROD_SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $PROD_SSH_KEY"

mkdir -p "$LOCAL_UPLOADS_DIR"

echo "==> Подключаемся к $PROD_USER@$PROD_HOST..."
echo "==> Копируем uploads из контейнера $PROD_BACKEND_CONTAINER на хост сервера..."

# Копируем из volume на файловую систему хоста во временную папку
REMOTE_TMP="/tmp/ntt-uploads-$(date +%Y%m%d-%H%M%S)"
ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" \
  "docker cp $PROD_BACKEND_CONTAINER:/app/uploads/. $REMOTE_TMP"

echo "==> Скачиваем файлы с $PROD_HOST:$REMOTE_TMP -> $LOCAL_UPLOADS_DIR ..."

# Пробуем rsync (сохраняет инкрементальность), иначе tar через SSH
if ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" "command -v rsync" &>/dev/null && command -v rsync &>/dev/null; then
  rsync -avz --progress \
    -e "ssh $SSH_OPTS" \
    "$PROD_USER@$PROD_HOST:$REMOTE_TMP/" \
    "$LOCAL_UPLOADS_DIR/"
else
  echo "  rsync не найден — используем tar+ssh"
  ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" "tar -czf - -C $REMOTE_TMP ." \
    | tar -xzf - -C "$LOCAL_UPLOADS_DIR"
fi

echo "==> Удаляем временную папку на сервере..."
ssh $SSH_OPTS "$PROD_USER@$PROD_HOST" "rm -rf $REMOTE_TMP"

echo ""
echo "Готово. Uploads с прода скопированы в $LOCAL_UPLOADS_DIR"
echo "Файлов: $(find "$LOCAL_UPLOADS_DIR" -type f | wc -l | tr -d ' ')"
