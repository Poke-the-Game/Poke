var winston = require('winston'),
    entities = require('./Entities.js'),
    utils = require('./Utils.js');


/*
 * General game handler
 */
function Game(client1, client2, game_type) {
    this.players = [];
    this.balls = [];
    this.powerups = [];

    this.tick = 0;
    this.tick_duration = 50;
    this.game_loop = -1;
    this.start_delay = 3000;
    this.ended = false;

    if(game_type == "hardcore"){
        this.powerup_types = [
            "flip_screen",
            "beer",
            "freeze_snake",
            'mushroom'
        ];
    } else if(game_type == "classic"){
        this.powerup_types = [];
    } else if(game_type == "power") {
        this.powerup_types = [
            'grow_snake',
            'shrink_snake',
            'freeze_snake',
            'ghostify_snake',
            'flip_screen',
            'beer',
            'mushroom'
        ];
    } else {
        this.powerup_types = [
            'grow_snake',
            'grow_snake',
            'grow_snake',
            'grow_snake',
            'grow_snake',
            'grow_snake',
            'shrink_snake',
            'shrink_snake',
            'freeze_snake',
            'freeze_snake',
            'ghostify_snake',
            'flip_screen',
            'beer',
            'mushroom'
        ];
    }

    this.game_type = game_type;

    winston.info("Game type is", game_type);

    this.init(client1, client2);
}

Game.prototype.start = function() {
    winston.info(
        'Starting new game with ' +
        this.players.length +
        ' players!'
    );

    // run the game
    var last_time = Date.now();
    var _update = this.update.bind(this);
    this.game_loop = setInterval(_update, this.tick_duration);
}

Game.prototype.end = function() {
    if(this.ended)
        return;
    this.ended = true;

    for(var i=0;i<this.players.length;i++) {
        var cur = this.players[i];
        var other = this.players[(i+1)% 2];

        var text = "Your score: "+cur.score+"<br />"+utils.escapeHtml(other.name)+"'s score: "+other.score;

        if(cur.score > other.score){
            text = "<h3>You win!</h3>" + text; 
        } else if(cur.score < other.score){
            text = "<h2>You loose!</h2>" + text;
        }

        cur.connection.emit("end_game", text);
        cur.connection.disconnect();
    }

    clearInterval(this.game_loop);
}

Game.prototype.get_connections = function() {
    var conns = [];
    for(var i in this.players) {
        var cur = this.players[i];
        conns.push(cur.connection);
    }

    return conns;
}

Game.prototype.init = function(client1, client2) {
    // add two players to the game
    var p1 = new entities.Player(
        client1.name,
        client1.conn,
        "left",
        this
    )
    var p2 = new entities.Player(
        client2.name,
        client2.conn,
        "right",
        this
    )

    this.players.push(p1);
    this.players.push(p2);

    for(var i in this.players) {
        var cur = this.players[i];

        cur.snake.init(this);
    }

    // add one ball
    var ball = new entities.Ball(this, 640/2, 480/2, 3, 3);
    this.balls.push(ball);

        // say hello
    for(var i in this.players) {
        var cur = this.players[i];

        var names = [];
        for(var j in this.players) {
            if(i != j) {
                var other = this.players[j];
                names.push(other.name);
            }
        }

        cur.connection.emit(
            'ready', {
                opponent: names[0],
                game_type: this.game_type,
                delay: this.start_delay,
                name: cur.name,
                side: cur.side
        });
    }
}

Game.prototype.update = function() {
    /*
     * Movement
     */
    // balls
    for(var i in this.balls) {
        cur = this.balls[i];
        cur.update(1);
    }

    // snakes
    for(var i in this.players) {
        cur = this.players[i].snake;
        cur.update(1);
    }

    /*
     * Collisions
     */
    // balls
    for(var i in this.balls) {
        cur = this.balls[i];
        cur.handle_collisions();
    }

    // snakes
    for(var i in this.players) {
        cur = this.players[i].snake;
        cur.handle_collisions();
    }

    /*
     * Powerup spawning
     */

    //powerUp Multipiers
    var powerUpTickMuliplier = 100;
    var highPowerMultiplier = 10;


    var isNormalTick = (this.tick % powerUpTickMuliplier) == 0;
    var isUpTick = (this.tick % (Math.round(powerUpTickMuliplier / highPowerMultiplier))) == 0;

    if(isNormalTick || (this.game_type == "power" && isUpTick)) {
        this.spawn_random_powerup();
    }

    this.tick++;
}

Game.prototype.spawn_random_powerup = function() {

    if(this.powerup_types.length == 0){
        return;
    }

    var powerup = new entities.Powerup(
        Math.round(Math.random()*50+7)*10,
        Math.round(Math.random()*44+2)*10,
        this.powerup_types[Math.floor(Math.random()*this.powerup_types.length)],
        this,
        10*1000
    );

    this.powerups.push(powerup);
}


/*
 * Exports
 */
module.exports.Game = Game;
