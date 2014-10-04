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

    this.init(client1, client2);

    this.ended = false;
}

Game.prototype.start = function() {
    winston.info(
        'Starting new game with ' + 
        this.players.length +
        ' players!'
    );

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

        cur.connection.emit('ready', {names: names});
    }

    // run the game
    var last_time = Date.now();
    var _update = this.update.bind(this);
    setInterval(_update, this.tick_duration);
}

Game.prototype.end = function(msg) {
    if(this.ended)
        return;
    this.ended = true;

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
        {start: {x:0, y:0}, end: {x:0, y:480}}
    )
    var p2 = new entities.Player(
        client2.name,
        client2.conn,
        {start: {x:640-10, y:0}, end: {x:640-10, y:480}}
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
    var ball = new entities.Ball(this, 640/2-5, 480/2-5, 3, 3);

    this.balls.push(ball);
}

Game.prototype.update = function() {
    // move all balls
    for(var i in this.balls) {
        cur = this.balls[i];

        cur.update(1);
    }

    // move snakes
    for(var i in this.players) {
        cur = this.players[i].snake;

        cur.update(1);
    }

    // check for goal
    for(var i in this.players) {
        p = this.players[i];

        for(var i in this.balls) {
            b = this.balls[i];

            if(p.in_goal(b)) {
                p.increase_score(1);

                b.reset();
            }
        }
    }

    this.tick++;
}


/*
 * Exports
 */
module.exports.Game = Game;