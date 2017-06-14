/* <reference type="jquery"/> */
"use strict";

interface WebStreamClientOptions {
    host?: string
    port: number
}

/**
 * @typedef LiveLoggerClient
 * @class LiveLoggerClient
 * @param {object} options
 *
 */
class LiveLoggerClient {
    options;
    host;
    buffer;
    events: Function[];
    sock: WebSocket;
    commands: string[];


    private reconnect_timer;

    constructor(options?: WebStreamClientOptions) {
        let defaults: WebStreamClientOptions = {
            host: window.location.hostname,
            port: 13370
        };
        options = options || defaults;
        for (let k in defaults) {
            if (!(k in options)) options[k] = defaults[k];
        }
        this.options = options;
        this.host = options.host;
        this.buffer = [];
        this.events = [];
        this.commands = [];
    }

    getNextChunk() {
        if (!this.buffer.length) return false;
        const str = this.buffer.join('');
        let loc = str.indexOf("\0\0\0");
        console.log(loc);
        if( loc < 0 ) return false;
        let cmd = str.substr(0,loc);
        //console.log(cmd);
        this.buffer = [str.substr(cmd.length+3)];
        if( !this.buffer[0].length ) this.buffer.shift();
        console.log(this.buffer);
        return cmd;
    }

    connect() {

        let url = "ws://" + this.host + ":" + this.options.port;
        let sock = new WebSocket(url);
        let me = this;


        clearInterval(me.reconnect_timer);

        this.sock = sock;

        $(document).on("beforeunload", (e) => {
            this.sock.close();
            $(document).off();
            return true;
        });

        this.log("Connecting to: " + url);

        sock.onerror = () => {
            this.render("Error!");
        };

        sock.onmessage = (event) => {
            let data = event.data;
            if (!(this.buffer instanceof Array)) this.buffer = [];
            this.buffer.push(data);
            let cmd = this.getNextChunk();
            while (cmd) {
                this.commands.push(cmd);
                cmd = this.getNextChunk();
            }
            this.process();

        };

        sock.onopen = () => {
            clearInterval(me.reconnect_timer);
            this.log("CONNECTED!");
            //this.send("Here's some text that the server is urgently awaiting!");

        };

        sock.onclose = (event) => {
            this.render("closed, reconnecting...");
            this.reconnect_timer = setInterval(() => {
                this.render("reconnecting...");
                this.connect();
            }, 5000);

            return this;

        };

        setInterval(() => this.process(), 50);
    }

    process() {
        if (!this.commands.length) return;
        var command = this.commands.shift();
        this.emit("message", command);
        // console.log(command);

    }

    send(data: any) {
        try {
            this.sock.send(data + '\0');
            this.emit("sending", data);
        } catch (e) {
            this.log("Error sending data!");
        }
        return this;
    }

    incoming(data) {
        return this.emit("message", data);
    }

    render(data) {
        console.log(data);
    }

    log(message: any) {
        if (this.emit("log", message)) return;
        console.log(message);
    }

    emit(eventType: string, data) {
        eventType = eventType.toLowerCase();
        if (eventType in this.events) {
            let f = this.events[eventType];
            if (typeof f !== 'function') return false;
            f(data);
            return true;
        }
        return false;
    }

    on(eventType: string, fn: Function) {
        if (typeof fn != "function") throw new TypeError("fn must be a callback");
        this.events[eventType.toLowerCase()] = fn;
    }

}

