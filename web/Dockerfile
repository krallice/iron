FROM node:20-slim

WORKDIR /app

COPY web/package*.json ./
RUN npm install

COPY web/ ./

RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 