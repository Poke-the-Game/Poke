var ConnectionManager = function(){
    this.socket = io({
    reconnection: false
});
}

ConnectionManager.prototype.ready = function(handler){

    var self = this;

    //we are ready.
    this.socket.on("ready", function(data){
        //Call the opponent
        handler.call(this, self.socket, data.names);
    });

    this.socket.on("log", function(a){
        console.log(a);
    })
}

ConnectionManager.prototype.start = function(name){
    //Send Client Event to server
    this.socket.emit("client_begin", name);
}
