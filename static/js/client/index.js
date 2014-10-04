
$(function(){
    //create a client
    var Client = new ConnectionManager();

    Client.render(function(cmd, data) {
        if(cmd=="add_gobj") {
            $('<div class="'+data.type+'" id="'+data.id+'">')
                .css({top: data.x, left: data.y, zIndex:data.z})
                .appendTo($("#field"))//TODO store field somewhere
        }

        if(cmd=="move_gobj") {
            console.log($('#'+data.id).css({top: data.x, left: data.y}), data)
        }

        console.log(cmd);
    });

    //we are ready
    Client.ready(function(connection, opp){
        //do some rendering stuff here
        console.log(opp);
    });

    //Let's go!
    Client.start(prompt("Enter your name: "));
})
