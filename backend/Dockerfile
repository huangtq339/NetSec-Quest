FROM node:16-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/server.js"]