
$(function(){
    //create a client
    var Client = new ConnectionManager();

    //we are ready
    Client.ready(function(){
        //do some rendering stuff here
    });

    //Let's go!
    Client.start(prompt("Enter your name: "));
})
