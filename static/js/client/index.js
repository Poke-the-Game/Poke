
$(function(){
    //create a client
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
            if ( event.which == LEFT  || event.which  == A) {
                event.preventDefault();
                Client.set_snake_direction(270);
            }
            if ( event.which == UP || event.which == W ) {
                event.preventDefault();
                Client.set_snake_direction(0);
            }
            if ( event.which == RIGHT || event.which == D) {
                event.preventDefault();
                Client.set_snake_direction(90);
            }
            if ( event.which == DOWN || event.which == S ) {
                event.preventDefault();
                Client.set_snake_direction(180);
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

    var beer_timeout = -1;
    var flip_screen_timeout = -1;

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
            $('#field').addClass('flipped');
            window.clearTimeout(beer_timeout);
            beer_timeout = window.setTimeout(function() {$('#field').removeClass('flipped');}, data.duration)
        }

        if(cmd == "beer") {
            $('#field').addClass('drunken');
            window.clearTimeout(flip_screen_timeout);
            flip_screen_timeout = window.setTimeout(function() {$('#field').removeClass('drunken');}, data.duration)
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
