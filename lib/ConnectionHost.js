var Game = require("./Game.js").Game,
    winston = require("winston");

var ConnectionHost = function(io){
    var players = []; //the current players

    io.on("connection", function(socket){

        socket.emit("log", "Connection established! ");

        var socket = socket;

        socket.once("client_begin", function(name){
            players.push({
                "conn": socket,
                "name": name
            });


            //make new pairs for the length
            while(players.length >= 2){
                var player1 = players.pop();
                var player2 = players.pop();

                player1.conn.emit("log", "You are player1! ");
                player2.conn.emit("log", "You are player2! ");

                var Match = new Game(player1, player2);
                Match.start();
            }
        });
    });
}

module.exports.ConnectionHost = ConnectionHost;
