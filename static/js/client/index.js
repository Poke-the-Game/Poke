
$(function(){
    //create a client
    var Client = new ConnectionManager();
    var ConnGUI = new ConnectionGUI(Client);

    var GameReady = false;

    $( "body" ).keydown(function( event ) {
        var LEFT = 37;
        var UP = 38;
        var RIGHT = 39;
        var DOWN = 40;

        if(GameReady){
            if ( event.which == LEFT ) {
                event.preventDefault();
                Client.set_snake_direction(270);
            }
            if ( event.which == UP ) {
                event.preventDefault();
                Client.set_snake_direction(0);
            }
            if ( event.which == RIGHT ) {
                event.preventDefault();
                Client.set_snake_direction(90);
            }
            if ( event.which == DOWN ) {
                event.preventDefault();
                Client.set_snake_direction(180);
            }
        } else {
            if ( event.which == UP ) {
                event.preventDefault();
                ConnGUI.moveUp();
            }

            if ( event.which == DOWN ) {
                event.preventDefault();
                ConnGUI.moveDown();
            }
        }


    });

    Client.render(function(cmd, data) {
        if(cmd=="add_gobj") {
            $('<div class="'+data.type+'" id="'+data.id+'">')
                .css({left: data.x, top: data.y, zIndex:data.z})
                .appendTo($("#field"))//TODO store field somewhere
        }

        if(cmd=="move_gobj") {
            $('#'+data.id).css({left: data.x, top: data.y})
        }

        //TODO remove object

    });

    //we are ready
    Client.ready(function(connection, opp){

        //hide all the links
        ConnGUI.hide();

        //log the opponent
        console.log(opp);

        GameReady = true;
    });

    ConnGUI.init();
});
