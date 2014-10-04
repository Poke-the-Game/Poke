var ConnectionGUI = function(cli){
    this.the_client = cli;
};

ConnectionGUI.prototype.hide = function(){
    $("#menu").remove();
}

ConnectionGUI.prototype.moveUp = function(){
    $("#menu").trigger("cursor.up");
}

ConnectionGUI.prototype.moveDown = function(){
    $("#menu").trigger("cursor.down");
}

ConnectionGUI.prototype.empty = function(){
    return $("#menu")
    .off("click")
    .off("cursor.up")
    .off("cursor.down")
    .empty()
    .append(
        "<h1>POKE THE GAME</h1>",
        "<br />"
    )
}

ConnectionGUI.prototype.prompt = function(q, next){
    var me = this,
        form,
        prompt,
        onResponse;

    //where we want to place the prompt
    prompt = this.empty();

    prompt
    .append(
        $("<h2>").text(q),
        "<br />"
    )

    //what happens on response
    onResponse = function(e){

        //prevent Default
        e.preventDefault();

        //get the value
        var value = form.find("input").val();

        //and done
        me.empty();

        //And here is the response.
        next(value);
    }

    form = $("<form>")
    .append(
        $("<input type='text'>")
    )
    .on("submit", onResponse)
    .appendTo(prompt);

    prompt.on("click", function(){
        //Focus the input
        form.find("input").focus();
    }).click();
}

ConnectionGUI.prototype.alert = function(msg, next){

    var me = this;

    me.select(msg, (typeof next === "function")?["OK"]:[""], function(){
        if(typeof next === "function"){
            next();
        } else {
            me.alert(msg, next);
        }
    })
}

ConnectionGUI.prototype.select = function(msg, options, next, start_opt){
    var me = this,
        curIndex = (typeof start_opt == "number")?start_opt:0,
        redraw,
        prompt;

    //where we want to place the prompt
    prompt = this.empty();

    //redraw stuff
    redraw = function(){

        //the form
        var form = prompt.find("form");

        //Remove old span
        form.find("span").remove();

        //make a span
        var span = $("<span>").prependTo(form);


        options.map(function(element, index){

            //do nothing
            if(index == curIndex){
                span.append(
                    $("<span class='selected'>").text(element),
                    "<br />"
                );
            } else {
                span.append(
                    $("<span>").text(element),
                    "<br />"
                );
            }
        });
    }

    prompt
    .append(
        $("<h2>").text(msg),
        "<br />",
        $("<form>").append(
            $("<input type='submit' value='&nbsp; '>"),
            "<br />"
        ).on("submit", function(e){
            //dont do anything.
            e.preventDefault();

            //and done
            me.empty();

            //ok, now we are ready
            next(curIndex, options[curIndex]);
        })
    )

    prompt
    .on("cursor.up", function(){
        curIndex -= 1;

        while(curIndex < 0){
            curIndex += options.length;
        }

        redraw();
    })
    .on("cursor.down", function(){
        curIndex += 1;

        while(curIndex >= options.length){
            curIndex -= options.length;
        }

        redraw();
    })
    .on("click", function(){
        //Focus the input
        prompt.find("input[type=submit]").focus();
    }).click();

    redraw();
}

ConnectionGUI.prototype.init = function(){

    var me = this;

    me.prompt("Enter a name: ", function(name){
        me.the_client.start(name);
        me.begin_query();
    });
}

ConnectionGUI.prototype.begin_query = function(){

    var me = this;
    //List the people

    me.select("What do you want to do?",
        [
            "Create a new game",
            "Join an existing game",
            "Select automatically",
            "CANCEL"
        ],
        function(index, res){
            if(index == 0){
                me.create_new(false);
            } else if(index == 3){
                    me.disconnect();
            } else {
                me.alert("Loading list of people from the server ...", true);

                me.the_client.list(function(lbys){
                    if(index == 1){
                        me.join(lbys);
                    } else {
                        me.auto(lbys);
                    }
                });
            }
        },
        2
    );
}

ConnectionGUI.prototype.create_new = function(auto_accept){

    var me = this;

    var showWaitingPrompt = function(){
        me.select("Waiting for requests ...", ["CANCEL"], function(){
            me.disconnect();
        });
    }

    showWaitingPrompt();

    me.the_client.host(function(who, respond){
        if(auto_accept){
            //Automatically accept
            return respond(true);
        }

        me.select(who + " wants to play with you. ", ["Accept", "Deny"], function(index){
            respond(index == 0);
            if(index == 1){
                showWaitingPrompt();
            }
        });
    });
}

ConnectionGUI.prototype.join = function(lbys){
    var me = this;

    lbys.push("CANCEL");

    me.select("Which lobby do you want to join?", lbys, function(index, element){
        if(index !== lbys.length - 1){
            me.do_join(element);
        } else {
            me.begin_query();
        }
    });

}

ConnectionGUI.prototype.do_join = function(who){
    var me = this;

    me.alert("Waiting for response from "+who, true);

    me.the_client.joinLobby(who, function(success){
        if(!success){
            me.alert("Unable to join game. ", function(){
                me.begin_query();
            });
        }
    })

}

ConnectionGUI.prototype.auto = function(lbys){
    if(lbys.length == 0){
        this.create_new(true);
    } else {
        this.do_join(lbys[0]);
    }
}

ConnectionGUI.prototype.disconnect = function(){
    var me = this;

    me.select("You have disconnected. ", ["Reconnect"], function(){
        window.location.reload();
    });
    
    me.the_client.disconnect();
}
