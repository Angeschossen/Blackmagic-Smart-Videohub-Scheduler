module.exports = {
    emit: function (channel, data) {
        if (global.socketio == undefined) {
            return;
        }

        console.log(`Emitting data on channel ${channel}.`)
        global.socketio.emit(channel, data);
    }
}