//Load up expressJs
var
    express = require('express'),
    winston = require('winston'),

    ConnectionHost = require('./lib/server/ConnectionHost.js').ConnectionHost;

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

// Route: /lib/poke-client
app.use('/lib/poke-client/js/shared', express.static(__dirname + '/lib/shared'));
app.use('/lib/poke-client/js', express.static(__dirname + '/lib/client'));
app.use('/lib/poke-client/css', express.static(__dirname + '/lib/components/css/poke-client'));

//Route: /lib/press-start-2p
app.use('/lib/press-start-2p', express.static(__dirname + '/lib/components/css/press-start-2p'));

//Route: /lib
app.use('/lib', express.static(__dirname + '/bower_components'));

//Route: /
app.use(express.static(__dirname + '/static'));

//Listen on the HTTP Server
http.listen(port, function(){
  winston.info('listening on *:'+port.toString());
});

//Start a connection manager
var manager = new ConnectionHost(io);
