/* <reference type="jquery"/> */
"use strict";
/**
 * @typedef LiveLoggerClient
 * @class LiveLoggerClient
 * @param {object} options
 *
 */
var LiveLoggerClient = (function () {
    function LiveLoggerClient(options) {
        var defaults = {
            host: window.location.hostname,
            port: 13370
        };
        options = options || defaults;
        for (var k in defaults) {
            if (!(k in options))
                options[k] = defaults[k];
        }
        this.options = options;
        this.host = options.host;
        this.buffer = [];
        this.events = [];
        this.commands = [];
    }
    LiveLoggerClient.prototype.getNextChunk = function () {
        if (!this.buffer.length)
            return false;
        var str = this.buffer.join('');
        var loc = str.indexOf("\0\0\0");
        console.log(loc);
        if (loc < 0)
            return false;
        var cmd = str.substr(0, loc);
        //console.log(cmd);
        this.buffer = [str.substr(cmd.length + 3)];
        if (!this.buffer[0].length)
            this.buffer.shift();
        console.log(this.buffer);
        return cmd;
    };
    LiveLoggerClient.prototype.connect = function () {
        var _this = this;
        var url = "ws://" + this.host + ":" + this.options.port;
        var sock = new WebSocket(url);
        var me = this;
        clearInterval(me.reconnect_timer);
        this.sock = sock;
        $(document).on("beforeunload", function (e) {
            _this.sock.close();
            $(document).off();
            return true;
        });
        this.log("Connecting to: " + url);
        sock.onerror = function () {
            _this.render("Error!");
        };
        sock.onmessage = function (event) {
            var data = event.data;
            if (!(_this.buffer instanceof Array))
                _this.buffer = [];
            _this.buffer.push(data);
            var cmd = _this.getNextChunk();
            while (cmd) {
                _this.commands.push(cmd);
                cmd = _this.getNextChunk();
            }
            _this.process();
        };
        sock.onopen = function () {
            clearInterval(me.reconnect_timer);
            _this.log("CONNECTED!");
            //this.send("Here's some text that the server is urgently awaiting!");
        };
        sock.onclose = function (event) {
            _this.render("closed, reconnecting...");
            _this.reconnect_timer = setInterval(function () {
                _this.render("reconnecting...");
                _this.connect();
            }, 5000);
            return _this;
        };
        setInterval(function () { return _this.process(); }, 50);
    };
    LiveLoggerClient.prototype.process = function () {
        if (!this.commands.length)
            return;
        var command = this.commands.shift();
        this.emit("message", command);
        // console.log(command);
    };
    LiveLoggerClient.prototype.send = function (data) {
        try {
            this.sock.send(data + '\0');
            this.emit("sending", data);
        }
        catch (e) {
            this.log("Error sending data!");
        }
        return this;
    };
    LiveLoggerClient.prototype.incoming = function (data) {
        return this.emit("message", data);
    };
    LiveLoggerClient.prototype.render = function (data) {
        console.log(data);
    };
    LiveLoggerClient.prototype.log = function (message) {
        if (this.emit("log", message))
            return;
        console.log(message);
    };
    LiveLoggerClient.prototype.emit = function (eventType, data) {
        eventType = eventType.toLowerCase();
        if (eventType in this.events) {
            var f = this.events[eventType];
            if (typeof f !== 'function')
                return false;
            f(data);
            return true;
        }
        return false;
    };
    LiveLoggerClient.prototype.on = function (eventType, fn) {
        if (typeof fn != "function")
            throw new TypeError("fn must be a callback");
        this.events[eventType.toLowerCase()] = fn;
    };
    return LiveLoggerClient;
}());
