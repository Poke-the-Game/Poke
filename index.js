//Load up expressJs
var
    express = require('express'),
    winston = require('winston'),


    ConnectionManager = require('./lib/ConnectionHost.js').ConnectionHost;




//LOgger
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: true
});

//Handle errors which aren't caught.
process.on('uncaughtException', function(err) {
    try{
        winston.error("ERROR: ", err.toString());
        winston.error(err.stack);
    } catch(e){
        winston.error("ERROR: Error handling error. ");
        winston.error("ERROR: Exiting. ");
        process.exit(1);
    }
});

//Set up app + stuff
var app = express();
var http = require('http').Server(app);

//Socket io
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/static'));


http.listen(3000, function(){
  winston.info('listening on *:3000');
});

//Start a connection manager
var manager = new ConnectionManager(io);
manager.init();
