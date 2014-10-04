/*
 * Class for one specific player
 */
function Player(name, conn) {
    this.score = 0;
    this.name = name;
    this.snake = new Snake();
    this.connection = conn;

    this.goal_rect = goal_rect // [[x,y], [w,h]]
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
function Snake() {
    this.blocks = [];
    this.head_orientation = -1;
    this.color = '#00FF00';
    this.vx = 0;
    this.vy = 0;
}


/*
 * Ballz
 */
function Ball() {
    this.x = 10;
    this.y = 10;
    this.vx = 0;
    this.vy = 0;
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