var winston = require('winston');
var uuid = require('node-uuid');

var utils = require('./Utils.js');


/*
 * Class for one specific player
 */
function Player(name, conn, side) {
    this.score = 0;
    this.name = name;
    this.snake = new Snake(side);
    this.connection = conn;
    this.side = side;

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
function Snake(side) {
    this.blocks = [];
    this.connections = undefined;

    this.block_size = 10;
    this.side = side;

    this.respawn_timeout = 3000;
    this.state = "";

    this.inital_direction = (side == "left")?90:270;
    this.cur_direction = this.inital_direction;
    this.tick_speed = 2; // move every number of ticks
    this.tick_counter = 0;
}

Snake.prototype.init = function(game, start_x, start_y) {
    this.connections = game.get_connections();

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
    for(var i = 1 ; i < 20 ; i++) {
        this.blocks.push(new GameObject(this.connections, this.side + ' snake body', this.initial_x, this.initial_y-i*this.block_size));
    }

    this.cur_direction = this.inital_direction;
}

Snake.prototype.kill = function() {
    this.state = "dead";

    this._update_clients('blink_type', this.side + ' snake');
    setTimeout(this.build_default.bind(this), this.respawn_timeout);
}

Snake.prototype.transform_blocks = function() {
    if(this.state == "dead")
        return;

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
    if(x_abs < 0 || x_abs > 640-this.block_size) {
        this.kill();
    } else {
        var y_abs = (head.y + dy + 480) % 480;
        head.move_abs(x_abs, y_abs);

        var _last = this.blocks.pop();
        _last.move_abs(old_x, old_y);
        this.blocks.splice(1, 0, _last);
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
    // prevent snake from turning 180 degrees
    if((this.cur_direction + 180) % 360 != direction )
        this.cur_direction = direction;
}


/*
 * Ballz
 */
function Ball(game, x, y, vx, vy) {
    this.gobj = new GameObject(game.get_connections(), 'ball', x, y, 1);
    this.v = {x: vx, y: vy};
    this.game = game;
    this.radius = 5;

    this.initial_x = x;
    this.initial_y = y;

    this.velocity_vector = {
        start: {
            x: this.initial_x,
            y: this.initial_y
        }, 
        end: {
            x: this.initial_x+this.v.x,
            y: this.initial_y+this.v.y
        }
    };
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
    var dx = dticks * this.v.x;
    var dy = dticks * this.v.y;

    this.velocity_vector.start.x = this.gobj.x;
    this.velocity_vector.start.y = this.gobj.y;

    this.gobj.move(dx, dy, true);

    this.velocity_vector.end.x = this.gobj.x;
    this.velocity_vector.end.y = this.gobj.y;
}

Ball.prototype.reset = function() {
    this.gobj.move_abs(this.initial_x, this.initial_y);

    var speed = 3;
    this.v.x = Math.random()>0.5?speed:-speed;
    this.v.y = Math.random()>0.5?speed:-speed;

    this.velocity_vector = {
        start: {
            x: this.initial_x,
            y: this.initial_y
        }, 
        end: {
            x: this.initial_x+this.v.x,
            y: this.initial_y+this.v.y
        }
    };
}


/*
 * Powerupz
 */
function Powerup() {
    this.x = -1;
    this.y = -1;
}

Powerup.prototype.on_touch = function(Player, Game) {

}


/*
 * Exports
 */
module.exports.Player = Player;
module.exports.Ball = Ball;
module.exports.Powerup = Powerup;