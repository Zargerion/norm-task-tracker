# NORM TASK TRACKER — AI Agent Rules

## Навигация по документации

Документация разбита на файлы — читай только нужное:

- [docs/INDEX.md](docs/INDEX.md) — индекс всех доков (читай первым)
- [docs/CONTEXT.md](docs/CONTEXT.md) — полные требования заказчика
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — архитектура системы
- [docs/AUTH.md](docs/AUTH.md) — авторизация и Telegram-бот
- [docs/ROLES.md](docs/ROLES.md) — роли и права
- [docs/DESIGN.md](docs/DESIGN.md) — дизайн-система (цвета, стилистика)
- [docs/FEATURES.md](docs/FEATURES.md) — функционал по разделам
- [docs/DEPLOY.md](docs/DEPLOY.md) — деплой и инфраструктура

## Правила для AI-агентов

### Общие правила
1. При изменении функционала или требований — обновляй соответствующий MD файл в docs/
2. При добавлении новой сущности в БД — обновляй schema.prisma и docs/ARCHITECTURE.md
3. При изменении ролей/прав — обновляй docs/ROLES.md
4. Не создавай файлы документации без необходимости — обновляй существующие
5. Не дублируй логику между модулями — используй shared сервисы

### Структура проекта
- `backend/` — NestJS API (порт 4000)
- `bot/` — Telegram-бот (grammy)
- `frontend/` — Next.js (в контейнере 3000; на хосте в Compose проброшен **3100**, чтобы не конфликтовать с чужим :3000)
- `infra/` — Docker Compose, Ansible
- `scripts/` — bash-скрипты для dev/deploy

### Стек технологий
- Backend: NestJS + Prisma + PostgreSQL + Argon2 + JWT
- Bot: grammy (TypeScript)
- Frontend: Next.js App Router + Tailwind CSS v4 + Framer Motion
- Package manager: yarn

### Безопасность
- Пароли: Argon2
- JWT: httpOnly cookie (не в localStorage)
- Magic links: короткоживущие (15 мин), одноразовые
- TG bot token: только в ENV, никогда в коде
- Все секреты только в .env файлах
- CORS только для своего фронтенда
- Rate limiting на все публичные эндпоинты

### Цвета (захардкожены)
Используй только цвета из docs/DESIGN.md — не добавляй произвольные цвета.

### Не делай без явной просьбы
- Не рефакторь код вне задачи
- Не добавляй фичи сверх требований
- Не меняй схему БД без понимания миграций
