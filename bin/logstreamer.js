/**
 * Created by Noah on 4/24/2017.
 */

const noahserv = require('./noahserv');
const net = require("net");


const wsServer = noahserv.createServer({port: 8082});
const loggingServer = net.createServer();

loggingServer
.on("listening", () => console.log("Listening for logs on port " + loggingServer.address().port))
.on("connection",
    (socket) => {
        console.log("[loggingServer] Client connected");
        socket.on("data", function(data) {
            //console.log(data.toString());
            wsServer.send(data.toString());
        })
})
.on("error", (data) => { console.log(data); })
.listen({port: 8083});


