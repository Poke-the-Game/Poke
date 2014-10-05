var winston = require('winston');
var uuid = require('node-uuid');

var utils = require('./Utils.js');


/*
 * Class for one specific player
 */
function Player(name, conn, side) {
    this.score = 0;
    this.name = name;
    this.connection = conn;
    this.side = side;
    this.snake = new Snake(this);

    if(this.side == "left")
        this.goal_line = {start: {x:0, y:0}, end: {x:0, y:480}};
    else if(this.side == "right")
        this.goal_line = {start: {x:640-10, y:0}, end: {x:640-10, y:480}}
    else
        this.goal_line = undefined; // spectator

    // define all the events!
    this.init_event_callbacks();

    winston.info(
        'Created new player named "' + 
        this.name +
        '"'
    );
}

Player.prototype.init_event_callbacks = function() {
    var self = this;

    this.connection.on('snake_direction', function(degree) {
        self.snake.set_direction(degree);
    });
}

Player.prototype.in_goal = function(ball) {
    return utils.line_intersection(
        this.goal_line,
        ball.velocity_vector
    );
}


/*
 * Inheritance, fuck no
 */
function GameObject(conns, type, x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    this.id = uuid.v1();
    this.connections = conns;
    this.type = type;

    // tell clients about me
    this._update_clients(
        'add_gobj', {
            'x': this.x,
            'y': this.y,
            'z': this.z,
            'id': this.id,
            'type': this.type
        }
    );
}

GameObject.prototype._update_clients = function(cmd, dict) {
    for(var i in this.connections) {
        var conn = this.connections[i];
        conn.emit(cmd, dict);
    }
}

GameObject.prototype.move = function(dx, dy, animated) {
    this.move_abs(this.x+dx, this.y+dy, animated);
}

GameObject.prototype.move_abs = function(x, y, animated) {
    if(animated === undefined)
        animated = false;

    this.x = x;
    this.y = y;

    this._update_clients(
        'move_gobj', {
            'id': this.id,
            'x': this.x,
            'y': this.y,
            'animated': animated
        }
    );
}

GameObject.prototype.remove = function() {
    this._update_clients(
        'remove_gobj', {
            'id': this.id
        }
    );
}


/*
 * Snake thingy
 */
function Snake(player) {
    this.blocks = [];
    this.connections = undefined;

    this.block_size = 10;
    this.side = player.side;
    this.player = player;

    this.default_length = 5;
    this.respawn_timeout = 3000;
    this.state = "";

    this.inital_direction = (this.side == "left")?90:270;
    this.cur_direction = this.inital_direction;
    this.requested_direction = this.inital_direction;

    this.tick_speed = 2; // move every number of ticks
    this.tick_counter = 0;
}

Snake.prototype.init = function(game, start_x, start_y) {
    this.connections = game.get_connections();
    this.game = game;

    // initial block configuration
    this.initial_x = start_x;
    this.initial_y = start_y;

    this.build_default();
}

Snake.prototype._update_clients = function(cmd, dict) {
    for(var i in this.connections) {
        var conn = this.connections[i];
        conn.emit(cmd, dict);
    }
}

Snake.prototype.build_default = function() {
    this.state = "default";

    for(var i in this.blocks) {
        var cur = this.blocks[i];
        cur.remove();
    }
    this.blocks = [];

    this.blocks.push(new GameObject(this.connections, this.side + ' snake head', this.initial_x, this.initial_y));
    for(var i = 1 ; i < this.default_length ; i++) {
        this.blocks.push(new GameObject(this.connections, this.side + ' snake body', this.initial_x, this.initial_y-i*this.block_size));
    }

    this.cur_direction = this.inital_direction;
}

Snake.prototype.grow = function() {
    var last = this.blocks[this.blocks.length-1];
    this.blocks.push(new GameObject(this.connections, this.side + ' snake body', last.x, last.y));
}

Snake.prototype.shrink = function() {
    if(this.blocks.length > 2)
        this.blocks.pop().remove();
}

Snake.prototype.freeze = function(timeout) {
    this.state = "frozen";

    setTimeout((function() { this.state = "default"; }).bind(this), timeout);
}

Snake.prototype.kill = function() {
    this.state = "dead";

    this._update_clients('blink_type', this.side + ' snake');
    setTimeout(this.build_default.bind(this), this.respawn_timeout);
}

Snake.prototype.transform_blocks = function() {
    if(this.state != "default")
        return;

    // prevent snake from turning 180 degrees
    if((this.cur_direction + 180) % 360 != this.requested_direction )
        this.cur_direction = this.requested_direction;

    var head = this.blocks[0];
    var old_x = head.x;
    var old_y = head.y;

    // compute new head
    var dx = 0;
    var dy = 0;
    if(this.cur_direction == 0) {
        dy -= 1*this.block_size;
    } else if(this.cur_direction == 90) {
        dx += 1*this.block_size;
    } else if(this.cur_direction == 180) {
        dy += 1*this.block_size;
    } else if(this.cur_direction == 270) {
        dx -= 1*this.block_size;
    }

    // move head forward and place last block at its old position
    var x_abs = head.x + dx;
    var y_abs = (head.y + dy + 480) % 480;
    head.move_abs(x_abs, y_abs);

    var _last = this.blocks.pop();
    _last.move_abs(old_x, old_y);
    this.blocks.splice(1, 0, _last);
}

Snake.prototype.handle_collisions = function() {
    if(this.state != "default")
        return;

    // left/right wall collision
    var head = this.blocks[0];
    if(head.x < 0 || head.x > 640-this.block_size) {
        this.kill();
    }

    // snake on snake collision
    var this_head = this.blocks[0];
    for(var i in this.game.players) {
        var cur = this.game.players[i].snake;

        for(var j in cur.blocks) {
            var block = cur.blocks[j];
            if(block == this_head)
                continue;

            if(
                utils.rect_intersection(
                    {
                        x: this_head.x,
                        y: this_head.y,
                        w: this.block_size,
                        h: this.block_size
                    },
                    {
                        x: block.x,
                        y: block.y,
                        w: cur.block_size,
                        h: cur.block_size
                    }
                )
            ) {
                this.kill();
            }
        }
    }

    // snake on powerup collisions
    var head = this.blocks[0];
    for(var i in this.game.powerups) {
        var cur = this.game.powerups[i];

        if(
            utils.rect_intersection(
                {
                    x: head.x,
                    y: head.y,
                    w: this.block_size,
                    h: this.block_size
                },
                {
                    x: cur.gobj.x,
                    y: cur.gobj.y,
                    w: cur.block_size,
                    h: cur.block_size
                }
            )
        ) {
            cur.on_touch(this.player);
            cur.kill_me = true;
        }
    }
    for(var i = this.game.powerups.length-1 ; i >= 0 ; i--) {
        if(this.game.powerups[i].kill_me) {
            this.game.powerups[i].gobj.remove();
            this.game.powerups.splice(i, 1);
        }
    }
}

Snake.prototype.update = function(dticks) {
    if(this.tick_counter >= this.tick_speed) {
        // move it
        this.transform_blocks();

        this.tick_counter = 0;
    } else {
        this.tick_counter += dticks;
    }
}

Snake.prototype.set_direction = function(direction) {
    this.requested_direction = direction;
}


/*
 * Ballz
 */
function Ball(game, x, y, vx, vy) {
    this.gobj = new GameObject(game.get_connections(), 'ball', x, y, 1);
    this.v = {x: vx, y: vy};
    this.game = game;
    this.radius = 5;
    this.state = '';
    this.respawn_timeout = 2000;

    this.reset(x, y);
}

Ball.prototype.handle_collisions = function() {
    // check upper/lower wall
    if(this.gobj.y-this.radius < 0) {
        this.v.y = Math.abs(this.v.y);
    } else if(this.gobj.y+this.radius > 480) {
        this.v.y = -Math.abs(this.v.y);
    }

    // check snakes
    for(var i in this.game.players) {
        var cur_snake = this.game.players[i].snake;
        var block_size = cur_snake.block_size;

        for(var j in cur_snake.blocks) {
            var block = cur_snake.blocks[j];

            // upper edge
            var upper_edge = {
                start: {
                    x: block.x-this.radius,
                    y: block.y-this.radius
                },
                end: {
                    x: block.x+this.radius+block_size,
                    y: block.y-this.radius
                }
            };
            if(utils.line_intersection(upper_edge, this.velocity_vector)) {
                this.v.y = -Math.abs(this.v.y);
            }

            // lower edge
            var lower_edge = {
                start: {
                    x: block.x-this.radius,
                    y: block.y+this.radius+block_size
                },
                end: {
                    x: block.x+this.radius+block_size,
                    y: block.y+this.radius+block_size
                }
            };
            if(utils.line_intersection(lower_edge, this.velocity_vector)) {
                this.v.y = Math.abs(this.v.y);
            }

            // right edge
            var right_edge = {
                start: {
                    x: block.x+this.radius+block_size,
                    y: block.y-this.radius
                },
                end: {
                    x: block.x+this.radius+block_size,
                    y: block.y+this.radius+block_size
                }
            };
            if(utils.line_intersection(right_edge, this.velocity_vector)) {
                this.v.x = Math.abs(this.v.x);
            }

            // left edge
            var left_edge = {
                start: {
                    x: block.x-this.radius,
                    y: block.y-this.radius
                },
                end: {
                    x: block.x-this.radius,
                    y: block.y+this.radius+block_size
                }
            };
            if(utils.line_intersection(left_edge, this.velocity_vector)) {
                this.v.x = -Math.abs(this.v.x);
            }
        }
    }

    // check for goal
    for(var i = 0 ; i < this.game.players.length ; i++) {
        for(var j in this.game.balls) {
            var b = this.game.balls[j];

            var scorer = this.game.players[(i+1)%2];
            var receiver = this.game.players[i];
            if(receiver.in_goal(b)) {
                scorer.score++;

                // tell clients
                scorer.connection.emit(
                    'update_score', {
                        score: scorer.score,
                        pos: scorer.side
                    }
                );
                receiver.connection.emit(
                    'update_score', {
                        score: scorer.score,
                        pos: scorer.side
                    }
                );
                
                b.reset();
            }
        }
    }
}

Ball.prototype.update = function(dticks) {
    if(this.state == 'respawning')
        return;

    var dx = dticks * this.v.x;
    var dy = dticks * this.v.y;

    this.velocity_vector.start.x = this.gobj.x;
    this.velocity_vector.start.y = this.gobj.y;

    this.gobj.move(dx, dy, true);

    this.velocity_vector.end.x = this.gobj.x;
    this.velocity_vector.end.y = this.gobj.y;
}

Ball.prototype.reset = function(x, y) {
    this.state = 'respawning';

    x = (x === undefined)?640/2:x;
    y = (y === undefined)?Math.random()*(480-11)+10:y;

    this.gobj.move_abs(x, y);

    this.v.x *= Math.random()>0.5?1:-1;
    this.v.y *= Math.random()>0.5?1:-1;

    this.velocity_vector = {
        start: {
            x: x,
            y: y
        }, 
        end: {
            x: x+this.v.x,
            y: y+this.v.y
        }
    };

    setTimeout(
        (function() { this.state = 'default'; }).bind(this),
        this.respawn_timeout
    );
}


/*
 * Powerupz
 */
function Powerup(x, y, type, game, timeout) {
    this.type = type;
    this.gobj = new GameObject(game.get_connections(), 'powerup ' + this.type, x, y, 0);

    this.game = game;
    this.block_size = 10;

    this.kill_me = false;
    setTimeout((function() { this.kill_me = true; }).bind(this), timeout);
}

Powerup.prototype.on_touch = function(player) {
    if(this.type == 'grow_snake') {
        player.snake.grow();
    }

    if(this.type == 'shrink_snake') {
        player.snake.shrink();
    }

    if(this.type == 'freeze_snake') {
        player.snake.freeze(5000);
    }

    if(this.type == 'flip_screen') {
        player.connection.emit('flip_screen', {duration: 15000});
    }

    if(this.type == 'beer') {
        player.connection.emit('beer', {duration: 12000});
    }
}


/*
 * Exports
 */
module.exports.Player = Player;
module.exports.Ball = Ball;
module.exports.Powerup = Powerup;