# Архитектура системы

## Структура проекта

```
norm-task-tracker/
├── backend/          NestJS API (port 4000)
├── bot/              Telegram-бот (grammy, port —)
├── frontend/         Next.js (порт 3000 в процессе; в Docker на хосте 3100)
├── infra/            Docker Compose, Ansible
├── scripts/          Bash-скрипты
├── docs/             Документация
└── CLAUDE.md         Правила для AI-агентов
```

## Стек

| Слой | Технология |
|------|-----------|
| Backend API | NestJS 10 + TypeScript |
| ORM | Prisma 6 + PostgreSQL 16 |
| Auth | JWT (httpOnly cookie) + Argon2 |
| Magic Links | short-lived JWT (15min), одноразовые |
| Bot | grammy (TypeScript) |
| Frontend | Next.js 15 (App Router) + TypeScript |
| Styles | Tailwind CSS v4 |
| Animations | Framer Motion |
| Markdown | react-markdown + remark-gfm |
| File Upload | multipart (NestJS @nestjs/platform-express) |
| Package mgr | yarn |

## Схема БД (Prisma)

### User
```
id           uuid    PK
firstName    string
lastName     string
login        string  UNIQUE
passwordHash string
jobTitle     string?
favoriteColor string? (key из GENSHIN_COLORS)
description  string?
phone        string?
email        string? UNIQUE
telegramId   string? UNIQUE
isSuperAdmin boolean DEFAULT false
isApproved   boolean DEFAULT false
createdAt    DateTime
updatedAt    DateTime
```

### PendingCode (для регистрации через TG)
```
id        uuid   PK (это и есть код)
userId    uuid   FK User (UNIQUE)
expiresAt DateTime
createdAt DateTime
```

### MagicToken (для входа через TG)
```
id        uuid   PK
userId    uuid   FK User
token     string UNIQUE (JWT)
usedAt    DateTime?
expiresAt DateTime
createdAt DateTime
```

### Space (пространство)
```
id          uuid   PK
name        string UNIQUE
description string?
createdAt   DateTime
updatedAt   DateTime
```

### SpaceUser (участник пространства)
```
id        uuid      PK
userId    uuid      FK User
spaceId   uuid      FK Space
role      SpaceRole (ADMIN | MANAGER | EMPLOYEE)
createdAt DateTime
UNIQUE(userId, spaceId)
```

### Project
```
id          uuid   PK
spaceId     uuid   FK Space
name        string
description string? (Markdown)
color       string? (key из GENSHIN_COLORS)
imageUrl    string?
createdAt   DateTime
updatedAt   DateTime
```

### Milestone (точки на таймлайне проекта)
```
id          uuid   PK
projectId   uuid   FK Project
title       string
description string?
date        DateTime
notified    boolean DEFAULT false
createdAt   DateTime
```

### ProjectMember
```
id                   uuid    PK
projectId            uuid    FK Project
userId               uuid    FK User
notificationsEnabled boolean DEFAULT true
createdAt            DateTime
UNIQUE(projectId, userId)
```

### Task
```
id             uuid       PK
projectId      uuid       FK Project
spaceId        uuid       FK Space
title          string
description    string?    (Markdown)
estimatedHours float?
status         TaskStatus (CREATED|ACCEPTED|COMPLETED|APPROVED)
createdById    uuid       FK User
createdAt      DateTime
updatedAt      DateTime
```

### TaskAssignee
```
id        uuid PK
taskId    uuid FK Task
userId    uuid FK User
createdAt DateTime
UNIQUE(taskId, userId)
```

### TaskTimeRecord (трекинг реального времени)
```
id          uuid     PK
taskId      uuid     FK Task
acceptedAt  DateTime
completedAt DateTime?
createdAt   DateTime
```

### TaskAddition (дополнения/комментарии к задаче)
```
id        uuid     PK
taskId    uuid     FK Task
userId    uuid     FK User
content   string   (Markdown)
createdAt DateTime
updatedAt DateTime
```

### TaskAttachment
```
id        uuid    PK
taskId    uuid    FK Task
filename  string
url       string
mimeType  string
isImage   boolean DEFAULT false
size      int
createdAt DateTime
```

### Material (документы)
```
id           uuid         PK
spaceId      uuid         FK Space
title        string
content      string?      (Markdown body)
type         MaterialType (MARKDOWN | HTML)
htmlUrl      string?      (если HTML-файл загружен)
isPublic     boolean      DEFAULT false
isSpaceWide  boolean      DEFAULT false
createdById  uuid         FK User
createdAt    DateTime
updatedAt    DateTime
```

### MaterialAccess (точечный доступ)
```
id         uuid PK
materialId uuid FK Material
userId     uuid FK User
createdAt  DateTime
UNIQUE(materialId, userId)
```

### MaterialAttachment
```
id         uuid    PK
materialId uuid    FK Material
filename   string
url        string
mimeType   string
size       int
createdAt  DateTime
```

## API Endpoints (Backend)

### Auth
- `POST /api/auth/login` — логин по login/password → JWT cookie
- `GET  /api/auth/me` — текущий пользователь из JWT
- `POST /api/auth/magic` — обмен magic token → JWT cookie
- `POST /api/auth/logout` — удалить cookie

### Register
- `POST /api/register` — создать юзера + PendingCode (@Public)
- `GET  /api/register/status/:id` — статус заявки (@Public)

### Spaces (только SUPER_ADMIN)
- `GET    /api/spaces`
- `POST   /api/spaces`
- `GET    /api/spaces/:id`
- `PATCH  /api/spaces/:id`
- `DELETE /api/spaces/:id`
- `POST   /api/spaces/:id/members` — добавить юзера

### Users
- `GET    /api/spaces/:spaceId/users`
- `PATCH  /api/spaces/:spaceId/users/:id` — изменить роль/описание (ADMIN)
- `DELETE /api/spaces/:spaceId/users/:id` — удалить (ADMIN)

### Projects
- `GET    /api/spaces/:spaceId/projects`
- `POST   /api/spaces/:spaceId/projects`
- `PATCH  /api/spaces/:spaceId/projects/:id`
- `DELETE /api/spaces/:spaceId/projects/:id`
- `POST   /api/spaces/:spaceId/projects/:id/members`
- `PATCH  /api/spaces/:spaceId/projects/:id/members/:userId` — обновить notificationsEnabled
- `DELETE /api/spaces/:spaceId/projects/:id/members/:userId`

### Tasks
- `GET    /api/spaces/:spaceId/projects/:projectId/tasks`
- `POST   /api/spaces/:spaceId/projects/:projectId/tasks`
- `PATCH  /api/spaces/:spaceId/projects/:projectId/tasks/:id`
- `DELETE /api/spaces/:spaceId/projects/:projectId/tasks/:id`
- `PATCH  /api/spaces/:spaceId/projects/:projectId/tasks/:id/status`
- `POST   /api/spaces/:spaceId/projects/:projectId/tasks/:id/assignees`
- `POST   /api/spaces/:spaceId/projects/:projectId/tasks/:id/additions`
- `POST   /api/spaces/:spaceId/projects/:projectId/tasks/:id/attachments`

### Materials
- `GET    /api/spaces/:spaceId/materials`
- `POST   /api/spaces/:spaceId/materials`
- `GET    /api/materials/:id` — публичный доступ (@Public с проверкой isPublic)
- `PATCH  /api/spaces/:spaceId/materials/:id`
- `DELETE /api/spaces/:spaceId/materials/:id`
- `GET    /api/materials/:id/download` — скачать HTML

### Upload
- `POST /api/upload` — загрузить файл → вернуть URL

### Bot Webhook
- `POST /api/bot/webhook` — TG webhook endpoint (@Public)
