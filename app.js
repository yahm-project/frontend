var express = require('express');
var cors = require('cors')
var app = express();
var bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/dist'));
app.use(cors())

var path = require('path');
global.appRoot = path.resolve(__dirname);


app.get('/', function(req, res) {
    res.sendFile(__dirname + '/dist/index.html');
});

app.use(function(req, res) {
    res.status(404).send({ url: req.originalUrl + ' not found' })
});

let port = process.env.BIND_PORT

app.listen(port, function () {
  console.log(`Node server started on port ${port} !`);
});
