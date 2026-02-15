FROM node:18-alpine
WORKDIR /usr/src/app
# install build tools and dependencies (including devDependencies for tests/build)
COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install
COPY . .
# build TypeScript
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/index.js"]
