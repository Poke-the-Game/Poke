//Load up expressJs
var
    express = require('express'),
    winston = require('winston'),

    ConnectionHost = require('./lib/ConnectionHost.js').ConnectionHost;

//Winston: Logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
  prettyPrint: true,
  colorize: true,
  silent: false,
  timestamp: true
});

//Handle errors which aren't caught.
process.on('uncaughtException', function(err) {
    //log the errors
    try{
        winston.error(err.stack);
    } catch(e){
        winston.error("ERROR: Error handling error. ");
        winston.error("ERROR: Exiting. ");
        process.exit(1);
    }
});

//Create new express JS things
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
app.use('/lib', express.static(__dirname + '/bower_components'))
app.use(express.static(__dirname + '/static'));
http.listen(port, function(){
  winston.info('listening on *:'+port.toString());
});

//Start a connection manager
var manager = new ConnectionHost(io);
