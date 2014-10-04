var Game = require("./Game.js").Game,
    winston = require("winston");

var ConnectionHost = function(io){
    this.waiters = [];
    this.io = io;
    this.games = [];

}

ConnectionHost.prototype.init = function(){
    var self = this;

    this.io.on("connection", function(conn){
        winston.info("Connected user");
        conn.on("client_ready", function(name){
            winston.info("User is ready", name);
            self.waiters.push({"conn": conn, "name": name});
            self.start_games();
        });
    });
}

ConnectionHost.prototype.start_games = function(){
    while(this.waiters.length >= 2){
        //find a and b
        var a = this.waiters.pop();
        var b = this.waiters.pop();

        //Log users
        winston.info("Paring Users", a.name, b.name);

        //Create a new Game and push it to the quenue
        var NewGame = new Game(a, b);
        this.games.push(NewGame);

        //Listen to the disconnects
        a.conn.on("disconnect", function(){
            NewGame.end("Player "+a.name+" disconnected");
        });

        b.conn.on("disconnect", function(){
            NewGame.end("Player "+b.name+" disconnected");
        });
    }
}

module.exports.ConnectionHost = ConnectionHost;
