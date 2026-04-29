# ─────────────────────────────────────────────────────────
#  ONG Platform — Frontend
#  Stage 1 (builder): compila o React com Vite
#  Stage 2 (prod):    serve com Nginx Alpine
# ─────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências (camada separada para cache)
COPY package*.json ./
RUN npm install

# Copia o código-fonte e builda
COPY . .
RUN npm run build

# ── Stage 2: Produção com Nginx ───────────────────────────
FROM nginx:1.27-alpine AS prod

# Remove OBRIGATORIAMENTE a config padrão do Nginx
# (sem isso, ela conflita com a nossa e o container falha)
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia nossa config customizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia o build gerado pelo Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Ajusta permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
