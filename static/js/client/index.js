
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

    //OK, we want our names.
    Client.start(prompt("Enter your name: "));

    whatToDo = function(){
        Client.list(function(lbys){
            var text = lbys.join("\n");

            text = "The following player(s) do not currently have partners: \n\n\n"
            + text
            + "\nDo you want to join one game? Click OK to join a game or CANCEL to create a new one. ";

            //Do we want to join or create a new one.
            if(!confirm(text)){

                alert("Will now accept requests. "); 

                Client.host(function(who, respond){
                    var q = confirm("'" + who + "' wants to play with you? \nAccept the request?")
                    respond(q);
                });
            } else {
                //Who we want to join
                var who = prompt("Enter the name of the person you want to join. ");

                Client.joinLobby(who, function(answer){
                    if(!answer){
                        alert("Unable to join the specefied game. ");
                        whatToDo();
                    }
                });
            }

        });
    };


    window.start = whatToDo;

});
