var express = require('express');
var cors = require('cors')
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static(__dirname + '/public'));
app.use(cors())

var path = require('path');
global.appRoot = path.resolve(__dirname);


app.get('/', function(req, res){
  res.sendFile(__dirname + '/www/index.html');
});

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

app.listen(80, function () {
  console.log('Node API server started on port 3000!');
});