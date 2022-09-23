const net = require('net');
const fs = require('fs');


const mode = "routing";
const server = net.createServer(function (socket) {
	let file = fs.readFileSync(`./initial.txt`, 'utf-8');
	socket.write(file.toString() + '\r\n');

	if (mode != "initial") {
		setInterval(() => {
			file = fs.readFileSync(`./${mode}.txt`, 'utf-8');
			socket.write(file.toString() + '\r\n');
		}, 5000);
	}

	//socket.pipe(socket);
});

server.listen(9990, '127.0.0.1');