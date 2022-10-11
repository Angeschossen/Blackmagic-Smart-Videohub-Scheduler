import { Server } from "socket.io";


export default (io: Server, socket: any) => {
    const createdMessage = (msg: any) => {
        console.log(msg);
        socket.broadcast.emit("newIncomingMessage", msg);
    };

    socket.on("createdMessage", createdMessage);
};