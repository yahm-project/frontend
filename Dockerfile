FROM node:12

COPY . /frontend

WORKDIR /frontend

RUN npm install --save-dev

CMD npm start
