import { Server } from "socket.io";


export default (io: Server, socket: any) => {
    const createdMessage = (msg: any) => {
        socket.broadcast.emit("newIncomingMessage", msg);
    };

    socket.on("createdMessage", createdMessage);
};