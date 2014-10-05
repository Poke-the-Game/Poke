var winston = require('winston');

var entities = require('./Entities.js')


/*
 * General game handler
 */
function Game(client1, client2) {
    this.players = [];
    this.balls = [];
    this.powerups = [];

    this.tick = 0;
    this.tick_duration = 50;
    this.game_loop = -1;
    this.start_delay = 3000;
    this.ended = false;

    this.powerup_types = [
        'grow_snake',
        'shrink_snake',
        'freeze_snake',
        'flip_screen'
    ];

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

Game.prototype.end = function(msg) {
    if(this.ended)
        return;
    this.ended = true;

    for(var i in this.players) {
        var cur = this.players[i];

        cur.connection.disconnect();
    }
    clearInterval(this.game_loop);

    winston.info(
        'Ending game [' +
        msg +
        ']'
    );
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
        "left"
    )
    var p2 = new entities.Player(
        client2.name,
        client2.conn,
        "right"
    )

    this.players.push(p1);
    this.players.push(p2);

    for(var i in this.players) {
        var cur = this.players[i];

        cur.snake.init(
            this,
            cur.goal_line.start.x,
            (cur.goal_line.end.y-cur.goal_line.start.y)/2
        );
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
    if(this.tick % 200 == 0) {
        this.spawn_random_powerup();
    }

    this.tick++;
}

Game.prototype.spawn_random_powerup = function() {
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