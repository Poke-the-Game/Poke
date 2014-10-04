var Game = require("./Game.js").Game,
    winston = require("winston");

var ConnectionHost = function(io){

    var self = this;

    var players = {}; //the current players

    io.on("connection", function(socket){

        //Make a socket.
        var socket = socket;

        //Create a new socket
        socket.emit("log", "Connection established! ");

        socket.once("lobby_begin", function(name){
            //we have a name.
            var name = name;

            socket.on("lobby_list", function(){
                var lobbies = [];

                for(var lobby in players){
                    if(players.hasOwnProperty(lobby)){
                        lobbies.push(lobby);
                    }
                }

                socket.emit("lobby_list", lobbies);
            })

            socket.on("lobby_new", function(){
                //we want to create a new one, so no longer accept connections.
                players[name] = {"conn": socket, "name": name};

                //delete on disconect.
                socket.on("disconnect", function(){
                    winston.info("Disconnected", name);
                    delete players[name];
                });
            });

            socket.on("lobby_request_join", function(lby){
                if(!players.hasOwnProperty(lby)){
                    //lobby does not exist => do the joining now
                    socket.emit("lobby_request_join", false);
                    winston.info(name, " can not join", lby, "Does not exist. ");
                } else {
                    //Lobby exists => ask the other person
                    var other = players[lby];

                    other.conn.once("lobby_answer_request", function(response){
                        //we have our answer
                        if(!response){
                            //we do not want to join
                            socket.emit("lobby_request_join", false);
                            winston.info(name, " can not join", lby, "Denied. ")
                        } else {
                            //we want to join
                            socket.emit("lobby_request_join", true);
                            winston.info(name, " joined", lby);

                            //the other player is gone now.
                            delete players[lby];

                            //and start a game
                            self.startGame(other, {"conn": socket, "name": name});
                        }
                    });

                    other.conn.emit("lobby_answer_request", name);

                }
            });
        });




    });
}

ConnectionHost.prototype.startGame = function(player1, player2){
    //Log on the client side
    player1.conn.emit("log", "You are player1! ");
    player2.conn.emit("log", "You are player2! ");

    player1.conn.on("disconnect", function(){
        Match.end();
    });

    player2.conn.on("disconnect", function(){
        Match.end();
    });

    //Create a new match
    var Match = new Game(player1, player2);

    //Start the game after the intial delay
    setTimeout(function(){
        Match.start();
    }, Match.start_delay);
}

module.exports.ConnectionHost = ConnectionHost;
