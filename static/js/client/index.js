
$(function(){
    //create a client
    var Client = new ConnectionManager();

    $( "body" ).keydown(function( event ) {
        var LEFT = 37;
        var UP = 38;
        var RIGHT = 39;
        var DOWN = 40;
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
        //do some rendering stuff here
        console.log(opp);
    });

    //Let's go!
    Client.start(prompt("Enter your name: "));
})
