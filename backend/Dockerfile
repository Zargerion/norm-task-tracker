FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile

FROM deps AS build
COPY . .
RUN yarn prisma:generate
RUN yarn build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

EXPOSE 4000
CMD ["sh", "-c", "yarn prisma:migrate:deploy && yarn prisma:seed && node dist/src/main"]
