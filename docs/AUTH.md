# Авторизация и Telegram-бот

## Потоки авторизации

### 1. Регистрация нового пользователя

```
Сайт                Backend              TG Bot               TG User
 |                     |                    |                    |
 |-- POST /register --> |                   |                    |
 |   {firstName, ...}  |                   |                    |
 |                     |-- create User ---> |                    |
 |                     |   isApproved=false |                    |
 |                     |-- create PendingCode (UUID) -->        |
 |<-- {code, botUrl} --|                   |                    |
 |                     |                   |                    |
 |  [показать код пользователю + ссылку на бот]                 |
 |                     |                   |<-- /start code --> |
 |                     |                   |                    |
 |                     |<-- verify code ---|                    |
 |                     |   User.telegramId = tgId              |
 |                     |   User.isApproved = true              |
 |                     |   delete PendingCode                  |
 |                     |-- create MagicToken ----------------> |
 |                     |                   |-- send magic link->|
 |                     |                   |                    |
[Пользователь кликает magic link]           |                    |
 |                     |                   |                    |
 |-- GET /auth/magic?token=... -->         |                    |
 |                     |-- verify + use token                  |
 |                     |-- set JWT cookie                      |
 |<-- redirect /       |                   |                    |
```

### 2. Повторный вход через бота

```
TG User         TG Bot              Backend
   |               |                    |
   |-- /войти ---> |                    |
   |               |-- find by tgId --> |
   |               |                   |-- create MagicToken
   |               |<-- token ---------|
   |<-- magic link |
   |               |
[клик → /auth/magic?token=...]
   |                                    |
   |-------------- обмен token на JWT cookie -------> |
```

### 3. Вход по логину/паролю

```
Frontend → POST /api/auth/login {login, password}
Backend  → verify password (Argon2) → JWT cookie (1h)
```

## Токены

### JWT (сессионный)
- Хранится в httpOnly cookie `ntt_token`
- Срок: 1 час
- Payload: `{ sub: userId, login, isSuperAdmin, spaceId? }`

### Magic Token (одноразовый)
- Генерируется ботом/backend при запросе входа
- Срок: 15 минут
- Одноразовый: после использования `usedAt` проставляется
- Хранится в таблице `MagicToken`

### Pending Code (регистрационный)
- UUID, хранится в `PendingCode`
- Срок: 24 часа
- После верификации удаляется

## Telegram Bot

### Token
Значение только в переменной окружения `BOT_TOKEN` (см. `backend/.env.example`), в коде и документации не дублируйте реальный токен.

### Команды бота
| Команда | Описание |
|---------|---------|
| `/start` | Начало. Если передан код — верифицировать регистрацию |
| `/войти` | Получить magic link для входа на сайт |
| `/help` | Список команд |

### Верификация регистрации
```
/start <UUID-код>
```
Бот ищет PendingCode по UUID, привязывает tgId к User, отправляет magic link.

### Magic Link формат
```
https://<FRONTEND_URL>/auth/magic?token=<JWT>
```

## Guards (Backend)

### JwtAuthGuard
- Применяется глобально
- Читает `ntt_token` из httpOnly cookie
- Пропускает роуты с `@Public()` декоратором

### RolesGuard
- Применяется глобально
- Декоратор `@Roles(SpaceRole.ADMIN)` или `@SuperAdminOnly()`
- Проверяет роль в контексте текущего пространства

### SpaceGuard
- Проверяет что пользователь является членом пространства из URL-параметра `:spaceId`
- SUPER_ADMIN всегда проходит

## Безопасность

- Argon2id для паролей (memory=65536, iterations=3)
- Rate limiting: 5 req/min на /api/auth/login, 3 req/min на /api/register
- Magic tokens: одноразовые, 15-минутное TTL, проверка IP не обязательна (TG сессия уже безопасна)
- CORS: только FRONTEND_URL
- Helmet: все стандартные заголовки
