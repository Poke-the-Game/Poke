var ConnectionManager = function(){
    this.socket = io();
}

ConnectionManager.prototype.ready = function(handler){

    var self = this;

    //we are ready.
    this.socket.on("ready", function(data){
        //Call the opponent
        console.log("ON_READY_EVENT");
        ready.call(this, self.socket, data.names);
    });
}

ConnectionManager.prototype.start = function(name){
    //Send Client Event to server
    this.socket.emit("client_ready", name);
}
