/*
 * Class for one specific player
 */
function Player(name, conn, goal_rect) {
    this.score = 0;
    this.name = name;
    this.snake = new Snake();
    this.connection = conn;

    this.goal_rect = goal_rect; // [[x,y], [w,h]]

    // define all the events!
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
 * Snake thingy
 */
function Snake(start_x, start_y) {
    this.blocks = [];
    this.head_orientation = -1;
    this.color = '#00FF00';

    this.cur_direction = 90;
    this.tick_speed = 5; // move every number of ticks
    this.last_tick = -1;

    // initial block configuration
    this.blocks.push([start_x, start_y]);
    this.blocks.push([start_x, start_y-1]);
    this.blocks.push([start_x, start_y-2]);
}

Snake.prototype.transform_blocks = function() {
    var head_x = this.blocks[0][0];
    var head_y = this.blocks[0][1];

    // remove last block
    this.block.pop();

    // compute new head
    if(this.cur_direction == 0) {
        head_y -= 1;
    } else if(this.cur_direction == 90) {
        head_x += 1;
    } else if(this.cur_direction == 180) {
        head_y += 1;
    } else if(this.cur_direction == 270) {
        head_x -= 1;
    }

    this.block.push([head_x, head_y]);
}

Snake.prototype.move = function(cur_ticks) {
    if(cur_ticks - this.last_tick > this.tick_speed) {
        // move it
        this.transform_blocks();

        this.last_tick = cur_ticks;
    }
}

Snake.prototype.change_direction = function(direction) {
    this.cur_direction = direction;
}


/*
 * Ballz
 */
function Ball(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = '#FF0000';
}

Ball.prototype.move = function(dt) {
    this.x += dt * this.vx;
    this.y += dt * this.vy;
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