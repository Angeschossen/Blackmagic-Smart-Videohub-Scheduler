const net = require('net');
const fs = require('fs');


const server = net.createServer(function(socket) {
	const file = fs.readFileSync('./sample-response.txt', 'utf-8');
	socket.write(file.toString() +'\r\n');

	//socket.pipe(socket);
});

server.listen(9990, '127.0.0.1');