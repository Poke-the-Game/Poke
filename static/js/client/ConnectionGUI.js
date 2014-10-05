var ConnectionGUI = function(cli){
    this.the_client = cli;
};

ConnectionGUI.prototype.hide = function(){
    $("#menu").hide();
}

ConnectionGUI.prototype.moveUp = function(){
    $("#menu").trigger("cursor.up");
}

ConnectionGUI.prototype.moveDown = function(){
    $("#menu").trigger("cursor.down");
}

ConnectionGUI.prototype.doTab = function(rev){

    var as = $("#menu").find("a");

    var index = (function(){
        for(var i=0;i<as.length;i++){
            if(as.eq(i).hasClass("active")) {
                return i;
            }
        }

        return -1;
    })();

    if(rev){
        if(index == -1){
            index = as.length - 1;
        } else {
            index--;
        }
    } else {
        index++;
    }


    if(index >= as.length || index  == -1){
        //OK, thats it => return to the default;
        as
        .removeClass("active");

        $("#menu").click();

        $("span.selected").removeClass("tabbed");

        return;
    }

    $("span.selected").addClass("tabbed");

    as
    .removeClass("active")
    .eq(index)
    .addClass("active")
    .focus();


}

ConnectionGUI.prototype.empty = function(){
    return $("#menu")
    .show()
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
        form.find("span.wrapper").remove();

        //make a span
        var span = $("<span class='wrapper'>").prependTo(form);


        options.map(function(element, index){

            //do nothing
            if(index == curIndex){
                span.append(
                    $("<span class='selected'>").text(element).click(function(){
                        curIndex = index;
                        redraw();
                    }).dblclick(function(){
                        curIndex = index;
                        redraw();
                        form.submit();
                    }),
                    "<br />"
                );
            } else {
                span.append(
                    $("<span>").text(element).click(function(){
                        curIndex = index;
                        redraw();
                    }).dblclick(function(){
                        curIndex = index;
                        redraw();
                        form.submit();
                    }),
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
            "Quick Start",
            "Create a new game",
            "Join an existing game",
            "ABOUT & HELP",
            "EXIT"
        ],
        function(index, res){

            if(index == 1){
                me.create_new(false);
            } else if(index == 3){
                me.about_box();
            } else if(index == 4){
                me.disconnect();
            } else {
                me.alert("Loading list of people from the server ...", true);

                me.the_client.list(function(lbys){
                    if(index == 2){
                        me.join(lbys);
                    } else {
                        me.auto(lbys);
                    }
                });
            }
        }
    );
}

var GameTypes = ["Normal", "Hardcore", "Classic", "Power Ups Everywhere"];
GameTypes.push("CANCEL");
var GameTypeNames = ["normal", "hardcore", "classic", "power"];

ConnectionGUI.prototype.create_new = function(auto_accept, type){

    var me = this;

    var showWaitingPrompt = function(){
        me.select("Waiting for requests ...", ["CANCEL"], function(){
            me.disconnect();
        });
    }

    var runType = function(type){
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
        }, type);
    }

    if(type){
        runType(type);
    } else {
        me.select("Select Game Type: ", GameTypes, function(index, type){

            if(index == GameTypes.length - 1){
                me.begin_query();
                return;
            }
            var type = GameTypeNames[index];
            runType(type);
        });
    }
}

ConnectionGUI.prototype.join = function(lbys){
    var me = this;

    var elems = lbys.map(function(element){
        return element[0]+ " ("+element[1]+")";
    });

    elems.push("CANCEL");

    me.select("Which player do you want to play with?", elems, function(index){
        if(index !== elems.length - 1){
            me.do_join(lbys[index][0]);
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
        this.create_new(true, GameTypes[0]);
    } else {
        this.do_join(lbys[0][0]);
    }
}

ConnectionGUI.prototype.disconnect = function(msg){
    var me = this;

    me.select("Disconnected. ", ["Reconnect"], function(){
        window.location.reload();
    });

    if(typeof msg == "string"){
        $("<div class='box'>").html(msg).insertAfter(
            $("#menu").find("h2")
        );
    }

    me.the_client.disconnect();
}


ConnectionGUI.prototype.about_box = function(start){

    var me = this;

    me.select("About & Help", ["What is POKE THE GAME?", "How to play?", "Legal", "BACK"], function(index, element){
        if(element == "BACK"){
            me.begin_query();
        } else {
            if(index == 0){
                me.about_about();
            } else if(index == 1){
                me.about_play();
            } else {
                me.about_legal();
            }
        }
    }, start);
}


ConnectionGUI.prototype.about_about = function(){

    var me = this;

    me.alert("What is POKE THE GAME?", function(){
        me.about_box(0);
    });

    $("<div class='box'>").html(
        "PONG + SNAKE = POKE <br /> \
        made by <br />\
        <a href='https://github.com/kpj' target='_blank'>@kpj</a>, \
        <a href='https://github.com/moritzmhmk' target='_blank'>@moritzmhmk</a>, \
        <a href='https://github.com/nk17' target='_blank'>@nk17</a> and \
        <a href='https://github.com/tkw1536' target='_blank'>@tkw1536</a> <br>\
        Source code at <a href='https://github.com/Poke-the-Game/Poke' target='_blank'>https://github.com/Poke-the-Game/Poke</a> "
    ).insertAfter(
        $("#menu").find("h2")
    );
}

ConnectionGUI.prototype.about_play = function(){

    var me = this;

    me.alert("How to play?", function(){
        me.about_box(1);
    });

    $("<div class='box'>").html(
        "Move your SNAKE to protect your goal and collect the POWERUPS. <br /><br />Score a GOAL to gain points. <br /><br />Use UP, RIGHT, DOWN, LEFT or W, A, S, D to control your snake. <br />Press ENTER to navigate menus. <br />Press TAB to highlight links. "
    ).insertAfter(
        $("#menu").find("h2")
    );
}

ConnectionGUI.prototype.about_legal = function(){

    var me = this;

    me.alert("Legal", function(){
        me.about_box(2);
    });

    $("<div class='box'>").html(
        "POKE THE GAME<br /> \
        (c) 2014 The <a href='https://github.com/Poke-the-Game' target='_blank'>POKE THE GAME</a> Team <br />\
        Licensed under <a href='https://github.com/Poke-the-Game/Poke/blob/master/LICENSE' target='_blank'>MIT License</a><br />\
        <br /><br /><h2>Used works</h2><br /> \
        \
        <a href='https://www.google.com/fonts/specimen/Press+Start+2P' target='_blank'>Press Start 2P Font</a>, licensed under <a href='http://scripts.sil.org/OFL' target='_blank'>SIL Open Font License, 1.1</a> <br />\
        <a href='https://jquery.org/' target='_blank'>jQuery</a> 2.1.0, licensed under <a href='https://jquery.org/license/' target='_blank'>MIT License</a> <br />\
        <a href='http://expressjs.com/' target='_blank'>ExpressJS</a> 4.9.5, licensed under <a href='https://github.com/strongloop/express/blob/master/LICENSE' target='_blank'>MIT License</a> <br />\
        <a href='https://github.com/broofa/node-uuid' target='_blank'>node-uuid</a> 1.4.1, licensed under <a href='https://github.com/broofa/node-uuid/blob/master/LICENSE.md' target='_blank'>MIT License</a> <br />\
        <a href='http://socket.io/' target='_blank'>Socket.IO</a> 1.1.0, licensed under <a href='https://github.com/Automattic/socket.io/blob/master/LICENSE' target='_blank'>MIT License</a> <br />\
        <a href='https://github.com/flatiron/winston' target='_blank'>winston</a> 0.8.0, licensed under <a href='https://github.com/flatiron/winston/blob/master/LICENSE' target='_blank'>MIT License</a> <br />\
        "
    ).insertAfter(
        $("#menu").find("h2")
    );
}
