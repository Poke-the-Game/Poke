
$(function(){
    //create a client
    var GameState = {
    	snake_direction: -1,
    	effect_timeouts: {
    		beer: -1,
    		flip_screen: -1,
    		mushroom: -1
    	}
    }
    var Client = new ConnectionManager();
    var ConnGUI = new ConnectionGUI(Client);

    var GameReady = false;

    $( "body" ).keydown(function( event ) {
        var LEFT = 37;
        var A = 65;

        var UP = 38;
        var W = 87;

        var RIGHT = 39;
        var D = 68;

        var DOWN = 40;
        var S = 83;

        var TAB = 9;

        if(GameReady){
        	var _dir = GameState.snake_direction;
            if ( event.which == LEFT  || event.which  == A) {
                _dir = 270;                
            }
            if ( event.which == UP || event.which == W ) {
                _dir = 0;
            }
            if ( event.which == RIGHT || event.which == D) {
                _dir = 90;
            }
            if ( event.which == DOWN || event.which == S ) {
                _dir = 180;
            }

            if(_dir != GameState.snake_direction) {
            	event.preventDefault();
            	GameState.snake_direction = _dir;
            	Client.set_snake_direction(_dir);
            }
        } else {
            if ( event.which == UP ) {
                event.preventDefault();
                ConnGUI.moveUp();
            }

            if(event.which == W){
                ConnGUI.moveUp();
            }

            if ( event.which == DOWN ) {
                event.preventDefault();
                ConnGUI.moveDown();
            }

            if(event.which == S){
                ConnGUI.moveDown();
            }

            if(event.which == TAB){
                event.preventDefault();
                ConnGUI.doTab(event.shiftKey);
            }
        }


    });


    Client.render(function(cmd, data) {
        if(cmd == "add_gobj") {
            $('<div class="'+data.type+'" id="'+data.id+'">')
                .css({left: data.x, top: data.y, zIndex:data.z})
                .appendTo($("#field")); //TODO store field somewhere
        }

        if(cmd == "move_gobj") {
            $('#'+data.id).css({left: data.x, top: data.y});
        }

        if(cmd == "remove_gobj") {
            $('#'+data.id).remove();
        }


        if(cmd == "ghostify_snake") {
            $('.snake.body.'+data.side).css('opacity', 0.25);
        }

        if(cmd == "unghostify_snake") {
            $('.snake.body.'+data.side).css('opacity', 1.0);
        }

        if(cmd == "blink_type") {
            $('.' + data.split(' ').join('.')).addClass('blink');
        }

        if(cmd == "flip_screen") {
            $('#field').addClass('flipped_effect');
            window.clearTimeout(GameState.effect_timeouts.flip_screen);
            GameState.effect_timeouts.flip_screen = window.setTimeout(function() {$('#field').removeClass('flipped_effect');}, data.duration)
        }

        if(cmd == "beer") {
            $('#field').addClass('drunken_effect');
            window.clearTimeout(GameState.effect_timeouts.beer);
            GameState.effect_timeouts.beer = window.setTimeout(function() {$('#field').removeClass('drunken_effect');}, data.duration)
        }

        if(cmd == "mushroom_field") {
            $('#field').addClass('mushroom_effect');
            window.clearTimeout(GameState.effect_timeouts.mushroom_field);
            GameState.effect_timeouts.mushroom_field = window.setTimeout(function() {$('#field').removeClass('mushroom_effect');}, data.duration)
        }

        if(cmd == "mushroom_snake") {
            $('.snake.'+data.side).addClass('mushroom_effect');
            window.clearTimeout(GameState.effect_timeouts.mushroom_snake);
            GameState.effect_timeouts.mushroom_snake = window.setTimeout(function() {$('.snake.'+data.side).removeClass('mushroom_effect');}, data.duration)
        }
    });


    Client.update_score(function(data) {
        $score = $('#'+data.pos+'_score').html('');
        var score = data.score.toString()
        for(var i in score) {
            $score.append($('<img src="img/digits/'+score[i]+'.png" class="digit">'))
        }
    });

    var MakeTimeout = function(timeout){
        $("div.countdown")
        .show()
        .text(timeout.toString())
        .fadeOut(1000, function(){
            if(timeout !== 1){
                MakeTimeout(timeout - 1);
            } else {
                $("div.countdown").remove();
            }
        });
    }

    //we are ready
    Client.ready(function(connection, delay, side, name, opponent, game_type){

        //hide all the links
        ConnGUI.hide();

        if(side == "left"){
            $(".name_left").text(name);
            $(".name_right").text(opponent);
        } else {
            $(".name_right").text(name);
            $(".name_left").text(opponent);
        }

        //log the opponent
        MakeTimeout((delay / 1000));

        $(".name_right").fadeOut(delay);
        $(".name_left").fadeOut(delay);

        GameReady = true;
    }, function(msg){
        ConnGUI.disconnect(msg);
    });

    ConnGUI.init();
});
