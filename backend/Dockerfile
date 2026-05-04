FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
    libreoffice \
    fontconfig \
    ttf-dejavu \
    ttf-liberation

COPY package*.json ./
RUN npm install --omit=dev --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY src ./src

RUN mkdir -p /app/uploads/institucional

EXPOSE 3498

CMD ["npm", "start"]
