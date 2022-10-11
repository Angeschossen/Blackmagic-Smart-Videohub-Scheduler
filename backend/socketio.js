const { Server } = require("socket.io");

module.exports = {
    io: undefined,
    setup: function (server) {
        io = new Server(server);
    }
}