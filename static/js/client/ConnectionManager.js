var ConnectionManager = function(){
    this.socket = io({
    	reconnection: false
	});

    this.socket.on("log", function(a){
        console.log(a);
    })
}

ConnectionManager.prototype.ready = function(handler){
    var self = this;

    //we are ready.
    this.socket.on("ready", function(data){
        //Call the opponent
        handler.call(this, self.socket, data.names);
    });
}

ConnectionManager.prototype.render = function(handler) {


    this.socket.on("add_gobj", function(data){
        handler.call(this, "add_gobj", data);
    })

    this.socket.on("move_gobj", function(data){
        handler.call(this, "move_gobj", data);
    })

    this.socket.on("remove_gobj", function(data){
        handler.call(this, "remove_gobj", data);
    })

}

ConnectionManager.prototype.start = function(name){
    //Send Client Event to server
    this.socket.emit("client_begin", name);
}

ConnectionManager.prototype.set_snake_direction = function(deg) {
	this.socket.emit("snake_direction", deg);
} 
