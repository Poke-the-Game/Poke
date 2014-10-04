var winston = require('winston');
var uuid = require('node-uuid');


/*
 * Class for one specific player
 */
function Player(name, conn, goal_rect) {
    this.score = 0;
    this.name = name;
    this.snake = new Snake(conn, goal_rect[0][0], goal_rect[0][1]+goal_rect[1][1]/2);
    this.connection = conn;

    this.goal_rect = goal_rect; // [[x,y], [w,h]]

    // define all the events!
    this.init_event_callbacks();

    winston.info(
        'Created new player named "' + 
        this.name +
        '"'
    );
}

Player.prototype.init_event_callbacks = function() {
    this.connection.on('move', function(data) {
        this.snake.change_direction(data.degree);
    });
}

Player.prototype.in_goal = function(ball) {
    var gx = this.goal_rect[0][0];
    var gy = this.goal_rect[0][1];
    var gw = this.goal_rect[1][0];
    var gh = this.goal_rect[1][1];

    if(
        ball.x > gx &&
        ball.y > gy &&
        ball.x < gx + gw &&
        ball.y < gy + gh
    ) {
        return true;
    } else {
        return false;
    }
}


/*
 * Inheritance, fuck no
 */
function GameObject(conns, type, id, x, y, z) {
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
    if(animated === undefined)
        animated = false;

    this.x += dx;
    this.y += dy;

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
function Snake(conn, start_x, start_y) {
    this.blocks = [];
    this.head_orientation = -1;
    this.color = '#00FF00';
    this.connection = conn;

    this.block_size = 10;

    this.cur_direction = 90;
    this.tick_speed = 5; // move every number of ticks
    this.tick_counter = 0;

    // initial block configuration
    this.blocks.push(new GameObject([this.connection], 'snake.head', start_x, start_y));
    this.blocks.push(new GameObject([this.connection], 'snake.body', start_x, start_y-1*this.block_size));
    this.blocks.push(new GameObject([this.connection], 'snake.body', start_x, start_y-2*this.block_size));
}

Snake.prototype.transform_blocks = function() {
    var head = this.blocks[0];
    var old_x = head.x;
    var old_y = head.y;

    // compute new head
    var _x, _y;
    if(this.cur_direction == 0) {
        _y -= 1*this.block_size;
    } else if(this.cur_direction == 90) {
        _x += 1*this.block_size;
    } else if(this.cur_direction == 180) {
        _y += 1*this.block_size;
    } else if(this.cur_direction == 270) {
        _x -= 1*this.block_size;
    }

    // move head forward and place last block at its old position
    head.move(_x, _y);
    this.blocks[this.blocks.length-1].move(old_x, old_y);
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

Snake.prototype.change_direction = function(direction) {
    this.cur_direction = direction;
}


/*
 * Ballz
 */
function Ball(game, x, y, vx, vy) {
    this.gobj = new GameObject(game.get_connections(), 'ball', x, y, 1);
    this.color = '#FF0000';
}

Ball.prototype.update = function(dticks) {
    this.gobj.move(dticks * this.vx, dticks * this.vy);
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