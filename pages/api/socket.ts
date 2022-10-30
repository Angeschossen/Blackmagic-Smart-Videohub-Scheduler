import { Server } from "socket.io";
import messageHandler from "../../backend/utils/socketMessageHandler";

export default function SocketHandler(req: any, res: any) {
    // it means that socket server was already initialised
    if (res.socket.server.io) {
        //console.log("Socket already set up.");
        res.end()
        return
    }

    console.log("Setting up socket...");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    const onConnection = (socket: any) => {
        (global as any).socketio = socket;
        messageHandler(io, socket);
    };

    // define actions inside
    io.on("connection", onConnection);
    res.end();
    console.log("Socket io setup.")
}