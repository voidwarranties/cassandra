FROM node:lts-bookworm-slim
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .
CMD [ "node", "src/index.js" ]
