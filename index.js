//Load up expressJs
var express = require('express');

//Set up app + stuff
var app = express();
var http = require('http').Server(app);

//Socket io
var io = require('socket.io')(http);

app.get('/', express.static(__dirname + '/static'));

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
