
let Inst = module.exports = {
    sock: null,
    initialize: function(socket){
        Inst.sock = socket;
    },
    get: function(){
        return Inst.sock;
    }
}