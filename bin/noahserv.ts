'use strict'

/**
 * @module NoahServ NoahServ class for starting logging server.
 */

import {EventEmitter} from 'events';
import * as WS from 'ws';


/**
 * Noahserv class
 * @class NoahServ
 * @extends EventEmitter
 *
 */

const log = (msg, msg2?) => { typeof msg == "string" ? console.log("NoahServ: " + msg) : console.log(msg) };

class NoahServ extends EventEmitter {

    clients: Array<WS>;
    server: WS.Server;
    buffer: string[];
    commands: string[];
    queuedData: string[];


    constructor(options:{port:number}) {

        super();

        const server = new WS.Server(options, null);
        this.clients = [];
        this.server = server;
        this.queuedData = [];
        this.buffer = [];
        this.commands = [];
        server.on("error", (err) => {
            log('BIG ERROR: ' + err);
        });

        server.on("headers", (headers) => {
            log(headers);
        });

        server.on('connection', (client: WS) => {
            log("Incoming connection!",);
            this.clients.push(client);
            client.on('close', () => {
                let k = this.clients.indexOf(client);
                if (k > -1) this.clients.splice(k, 1);
                log("Removed closed port.");
            });
            client.on('message', (message) => {
                log('received: ' + message );
                if (!(this.buffer instanceof Array)) this.buffer = [];
                if (message.indexOf("\0") >= 0) {
                    log("Got \\0");
                    let parts = message.split("\0");
                    this.buffer.push(parts.shift());
                    parts.unshift( this.buffer.join(""));
                    this.buffer = [];
                    for (let i = 0; i < parts.length; i++) {
                        this.commands.push(parts[i]);
                    }
                } else {
                    this.buffer.push(message);
                    log("Received data, waiting for \\0");
                }
                this.emit('message', message, client);
            });
            this.emit('connection', client)
        });

        server.on("listening", () => {
            log("Listening...")
        });

        setInterval( ()=>this.process, 500 );

    }

    static createServer(options) {
        return new NoahServ(options);
    }


    process() {
        if( !this.commands.length ) return;
        const command = this.commands.shift();
        this.send(command);
    }

    getClients() {
        return this.clients;
    }

    send(message) {
     //   log("Sending " + message);
        if( this.clients.length === 0 ) {
            //this.queuedData.push(message);
            //if( this.queuedData.le)
            return;
        }
        for (let client of this.clients) {
            try {
                client.send(message);
            } catch(e) { }
        }

    }


}


module.exports = NoahServ

