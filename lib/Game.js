var entities = require('./Entities.js')


/*
 * General game handler
 */
function Game() {
    this.players = [];
    this.balls = [];
    this.powerups = [];

    this.current_tick = 0;
}

Game.prototype.main = function(client1, client2) {
    // add two players to the game
    var p1 = new entities.Player(
        client1.name,
        client1.conn,
        [[0, 0], [10, 480]]
    )
    var p2 = new entities.Player(
        client2.name,
        client2.conn,
        [[640-10, 0], [10, 480]]
    )

    this.players.push(p1);
    this.players.push(p2);

    // add one ball
    var ball = new entities.Ball(10, 10, 1, 1);

    this.balls.push(ball);

    // run the game
    var last_time = Date.now();
    while(true) {
        cur_time = Date.now();
        this.update(cur_time - last_time);
        last_time = cur_time;
    }
}

Game.prototype.update = function(dt) {
    // move all balls
    for(var i in this.balls) {
        cur = this.balls[i];

        cur.move(dt);
    }
}


/*
 * Exports
 */
module.exports.Game = Game;