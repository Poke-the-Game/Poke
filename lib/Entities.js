var winston = require('winston');
var uuid = require('node-uuid');

var utils = require('./Utils.js');


/*
 * Class for one specific player
 */
function Player(name, conn, goal_line) {
    this.score = 0;
    this.name = name;
    this.snake = new Snake();
    this.connection = conn;

    this.goal_line = goal_line; // {start: {x:, y:}, end: {x:, y:}}

    // define all the events!
    this.init_event_callbacks();

    winston.info(
        'Created new player named "' + 
        this.name +
        '"'
    );
}

Player.prototype.increase_score = function(amount) {
    this.score += amount;

    this.connection.emit('update_score', this.score);
}

Player.prototype.init_event_callbacks = function() {
    var self = this;

    this.connection.on('snake_direction', function(degree) {
        self.snake.set_direction(degree);
    });
}

Player.prototype.in_goal = function(ball) {
    var res = utils.line_intersection(this.goal_line, ball.velocity_vector);
    return res;
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
function Snake() {
    this.blocks = [];
    this.head_orientation = -1;
    this.color = '#00FF00';
    this.connections = undefined;

    this.block_size = 10;

    this.cur_direction = 90;
    this.tick_speed = 5; // move every number of ticks
    this.tick_counter = 0;
}

Snake.prototype.init = function(game, start_x, start_y) {
    this.connections = game.get_connections();

    // initial block configuration
    var head = new GameObject(this.connections, 'snake head', start_x, start_y);
    this.blocks.push(head);

    this.blocks.push(new GameObject(this.connections, 'snake body', start_x, start_y-1*this.block_size));
    this.blocks.push(new GameObject(this.connections, 'snake body', start_x, start_y-2*this.block_size));
}

Snake.prototype.transform_blocks = function() {
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
    head.move(dx, dy);
    var _last = this.blocks.pop();
    _last.move_abs(old_x, old_y);
    this.blocks.splice(1, 0, _last);
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
    this.color = '#FF0000';

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

Ball.prototype.update = function(dticks) {
    var dx = dticks * this.v.x;
    var dy = dticks * this.v.y;

    if(this.gobj.y+dy < 0) {
        this.v.y = Math.abs(this.v.y);
    } else if(this.gobj.y+dy+10 > 480) {
        this.v.y = -Math.abs(this.v.y);
    }

    this.velocity_vector.start.x += this.velocity_vector.end.x;
    this.velocity_vector.end.x += dx;
    this.velocity_vector.start.y += this.velocity_vector.end.y;
    this.velocity_vector.end.y += dy;

    this.gobj.move(dx, dy, true);
}

Ball.prototype.reset = function() {
    this.gobj.move_abs(this.initial_x, this.initial_y);

    this.v.x = 3;
    this.v.y = 3;

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