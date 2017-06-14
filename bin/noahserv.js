'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
/**
 * @module NoahServ NoahServ class for starting logging server.
 */
var events_1 = require("events");
var WS = require("ws");
/**
 * Noahserv class
 * @class NoahServ
 * @extends EventEmitter
 *
 */
var log = function (msg, msg2) { typeof msg == "string" ? console.log("NoahServ: " + msg) : console.log(msg); };
var NoahServ = (function (_super) {
    __extends(NoahServ, _super);
    function NoahServ(options) {
        var _this = _super.call(this) || this;
        var server = new WS.Server(options, null);
        _this.clients = [];
        _this.server = server;
        _this.queuedData = [];
        _this.buffer = [];
        _this.commands = [];
        server.on("error", function (err) {
            log('BIG ERROR: ' + err);
        });
        server.on("headers", function (headers) {
            log(headers);
        });
        server.on('connection', function (client) {
            log("Incoming connection!");
            _this.clients.push(client);
            client.on('close', function () {
                var k = _this.clients.indexOf(client);
                if (k > -1)
                    _this.clients.splice(k, 1);
                log("Removed closed port.");
            });
            client.on('message', function (message) {
                log('received: ' + message);
                if (!(_this.buffer instanceof Array))
                    _this.buffer = [];
                if (message.indexOf("\0") >= 0) {
                    log("Got \\0");
                    var parts = message.split("\0");
                    _this.buffer.push(parts.shift());
                    parts.unshift(_this.buffer.join(""));
                    _this.buffer = [];
                    for (var i = 0; i < parts.length; i++) {
                        _this.commands.push(parts[i]);
                    }
                }
                else {
                    _this.buffer.push(message);
                    log("Received data, waiting for \\0");
                }
                _this.emit('message', message, client);
            });
            _this.emit('connection', client);
        });
        server.on("listening", function () {
            log("Listening...");
        });
        setInterval(function () { return _this.process; }, 500);
        return _this;
    }
    NoahServ.createServer = function (options) {
        return new NoahServ(options);
    };
    NoahServ.prototype.process = function () {
        if (!this.commands.length)
            return;
        var command = this.commands.shift();
        this.send(command);
    };
    NoahServ.prototype.getClients = function () {
        return this.clients;
    };
    NoahServ.prototype.send = function (message) {
        //   log("Sending " + message);
        if (this.clients.length === 0) {
            //this.queuedData.push(message);
            //if( this.queuedData.le)
            return;
        }
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            try {
                client.send(message);
            }
            catch (e) { }
        }
    };
    return NoahServ;
}(events_1.EventEmitter));
module.exports = NoahServ;
