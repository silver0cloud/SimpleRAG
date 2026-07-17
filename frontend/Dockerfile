# ── frontend/Dockerfile ─────────────────────────────────────────────────
# Two stages: build the static React app with Node, then serve it with a
# tiny nginx image. The Node toolchain (100s of MB) never ships in the
# final image — only the compiled dist/ output does.

# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
