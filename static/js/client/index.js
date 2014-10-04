
$(function(){
    //create a client
    var Client = new ConnectionManager();

    //we are ready
    Client.ready(function(connection, opp){
        //do some rendering stuff here
        console.log("Hello!!!!");
    });

    //Let's go!
    Client.start(prompt("Enter your name: "));
})
