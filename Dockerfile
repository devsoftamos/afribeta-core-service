FROM node:18.18.2 as build
WORKDIR /usr/src/app
COPY ./package.json .
RUN npm install
COPY . .
RUN npx prisma generate 
RUN npm run build

FROM node:18.18.2 as production
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./prisma ./prisma
RUN npm install --only=prod
RUN npx prisma generate 
COPY --from=build /usr/src/app/dist ./dist
CMD ["node", "dist/server"]


 


