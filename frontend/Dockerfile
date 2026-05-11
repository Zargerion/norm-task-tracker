FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM deps AS build
COPY . .
RUN yarn build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
