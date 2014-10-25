(function(global){
    /**
     * Server protocol.
     * @namespace Poke.shared.protocol
     */
    var Protocol = {};

    /**
    * Render Protocol Events.
    * @memberof Poke.shared.protocol
    * @alias Poke.shared.protocol.RENDER
    * @enum {string}
    */
    Protocol.RENDER = {
        /** This protocol is unimplemented. **/
        UNIMPLEMENTED: "UNIMPLEMENTED"
    }

    //TODO: Implement GameTypes
    //TODO: Implement Render
    //TODO: Implement ConnectionHost
    //TODO: Implement Controller

    //and export it.
    global.protocol = Protocol;
})((typeof module !== "undefined" && module.exports)?module.exports:window);
