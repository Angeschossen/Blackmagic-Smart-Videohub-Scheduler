import { Server } from "socket.io";
import { Socket } from "socket.io-client";
import messageHandler from "../../backend/utils/socketMessageHandler";
import { checkServerPermission, getUserIdFromToken, isUser } from "../../components/auth/ServerAuthentication";
import { hasParams } from "../../components/utils/requestutils";

declare global {
    var socketio: Server
}


const onConnection = (socket: any) => {
    console.log(`User connected to socket.`)

    socket.on('disconnect', () => {
        console.log(`User disconnected from socket.`)
    })
}

export default async function SocketHandler(req: any, res: any) {
    if (!await checkServerPermission(req, res)) {
        return
    }

    // it means that socket server was already initialised
    if (res.socket.server.io) {
        console.log("Socket already set up.");
        res.end()
        return
    }

    console.log("Setting up socket...");
    const io = new Server(res.socket.server);
    res.socket.server.io = io
    global.socketio = io

    // define actions inside
    io.on("connection", onConnection)

    res.end();
    console.log("Socket io setup.")
}