FROM node:12

COPY . /frontend

WORKDIR /frontend

RUN npm install

CMD npm start
