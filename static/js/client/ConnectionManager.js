var ConnectionManager = function(){
    this.socket = io();
}

ConnectionManager.prototype.ready = function(handler){
    //we are ready.
    this.socket.on("ready", handler);
}

ConnectionManager.prototype.start = function(name){
    //Send Client Event to server
    this.socket.emit("client_ready", name);
}
