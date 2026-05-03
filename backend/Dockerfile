FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p /app/uploads/institucional

EXPOSE 3498

CMD ["npm", "start"]
