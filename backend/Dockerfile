FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json schema.sql ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build --chmod=644 /app/schema.sql ./schema.sql
USER node
RUN test -r /app/schema.sql
EXPOSE 5000
CMD ["node", "dist/index.js"]
