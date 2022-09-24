const net = require('net');
const fs = require('fs');


const mode = "initial";
const server = net.createServer(function (socket) {
	let file = fs.readFileSync(`./initial.txt`, 'utf-8');
	socket.write(file.toString() + '\r\n');

	if (mode != "initial") {
		console.log("Is not")
		setInterval(() => {
			file = fs.readFileSync(`./${mode}.txt`, 'utf-8');
			//socket.write(file.toString() + '\r\n');
		}, 5000);
	}

	/*
	socket.on('data', function(data) {
		console.log("Data IN:")
        console.log(data.toString());
    });*/

	socket.on('error', function(error){
		console.log(error);
	});

	socket.pipe(socket);
});

server.listen(9990, '127.0.0.1');