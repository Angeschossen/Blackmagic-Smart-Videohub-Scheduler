import { Server } from "socket.io";
import messageHandler from "../../backend/utils/socketMessageHandler";
import socketio from '../../backend/socketio';

export default function SocketHandler(req: any, res: any) {
    // it means that socket server was already initialised
    if (res.socket.server.io) {
        console.log("Already set up");
        res.end();
        return;
    }

    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    const onConnection = (socket: any) => {
        socketio.initialize(socket);
        messageHandler(io, socket);
    };

    // define actions inside
    io.on("connection", onConnection);

    console.log("Setting up socket");
    res.end();
    console.log("Socket io setup.")
}