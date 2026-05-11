# Деплой и инфраструктура

## Быстрый старт (локально)

```bash
# Установить зависимости и запустить всё
./scripts/dev.sh

# Только backend
cd backend && yarn install && yarn dev

# Только bot
cd bot && yarn install && yarn dev

# Только frontend
cd frontend && yarn install && yarn dev
```

## Структура инфраструктуры

```
infra/
├── docker-compose.yml          # Продакшн
├── docker-compose.dev.yml      # Локальная разработка
└── ansible/
    ├── deploy.yml
    ├── inventory/
    │   └── production
    ├── vars/
    │   └── production.yml
    └── templates/
        ├── docker-compose.j2
        └── nginx.conf.j2
```

## Переменные окружения

### Backend (.env)
```
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@db:5432/norm_task_tracker
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=1h
MAGIC_TOKEN_EXPIRES_IN=15m
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com
BOT_TOKEN=<token-from-botfather>
BOT_WEBHOOK_SECRET=<random-secret>
BOT_USERNAME=<bot_username_without_at>
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

Сид супер-админа (`yarn prisma:seed` / `scripts/seed.sh`) читает только ENV: `SEED_SUPER_ADMIN_LOGIN`, `SEED_SUPER_ADMIN_PASSWORD`, `SEED_SUPER_ADMIN_TELEGRAM_ID`; опционально `SEED_SUPER_ADMIN_FIRST_NAME`, `SEED_SUPER_ADMIN_LAST_NAME`. См. `backend/.env.example`.

### Bot (.env)
```
BOT_TOKEN=<token-from-botfather>
BACKEND_URL=http://backend:4000/api
FRONTEND_URL=https://your-domain.com
BOT_WEBHOOK_URL=https://your-domain.com/api/bot/webhook
BOT_WEBHOOK_SECRET=<same-as-backend>
```

### Frontend (.env)
```
API_BASE_URL=http://backend:4000/api
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
```

## Docker сервисы

| Сервис | Образ | Порт (внутренний) |
|--------|-------|-------------------|
| db | postgres:16-alpine | 5432 |
| backend | norm-task-tracker/backend | 4000 |
| bot | norm-task-tracker/bot | — |
| frontend | norm-task-tracker/frontend | 3000 |

## Bash скрипты

| Скрипт | Назначение |
|--------|-----------|
| `scripts/dev.sh` | Запустить всё локально |
| `scripts/build.sh` | Собрать Docker-образы |
| `scripts/deploy.sh` | Задеплоить через Ansible |
| `scripts/seed.sh` | Запустить сид БД |
| `scripts/logs.sh` | Просмотр логов |

## Порядок запуска (prod)

1. `docker-compose up -d db` → дождаться healthcheck
2. `docker-compose up -d backend` → запускает migrate + seed
3. `docker-compose up -d bot frontend`

## Nginx (proxy)

```nginx
# Frontend
location / {
    proxy_pass http://frontend:3000;
}

# Backend API
location /api/ {
    proxy_pass http://backend:4000/api/;
}

# Uploads
location /uploads/ {
    alias /var/uploads/;
}
```
