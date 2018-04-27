const net = require('net');
const uuid = require("uuid/v1");
const log = require('winston');
const mgpool = require('./pool.js');
const mgproto = require('./protobuf/mg_pb.js');
const client = require('./client.js');

let connections = [];
let pool = null;

function handleJoin(id, message) {
    let response = new proto.MGJoinResponse();
    //Always accepted
    response.setAccepted(true);
    sendTo(id, proto.MGMessages.MG_JOIN_RESPONSE, response);
    pool.addWorker(id, message.getPrettyName());
}

function dispose(id) {
    pool.removeWorker(id);
	if (connections[id] !== undefined)
		connections[id].destroy();
	delete connections[id];
}

function init(_pool) {
    pool = _pool;
    net.createServer(function(sock) {
        let id = uuid();
        let joined = false;
        connections[id] = sock;
        log.verbose(`New connection from ${id} (${sock.remoteAddress} : ${sock.remotePort})`);

        sock.on('data', function(data) {
            log.verbose(`New message from ${id}`)
            let bytes = Array.prototype.slice.call(data, 0);
            let type = bytes[0];
            let size = bytes[1];
            let message = null;
            switch(type) {
                case proto.MGMessages.MG_JOIN:
                    if(!joined) {
                        message = proto.MGJoin.deserializeBinary(bytes.slice(2, 2 + size));
                        handleJoin(id, message);
                        joined = true;
                    }
                    break;
                case proto.MGMessages.MG_COMPUTE_RESPONSE:
                    message = proto.MGComputeResponse.deserializeBinary(bytes.slice(2, 2 + size));
                    pool.onResponse(id, message);
                    break;
                case proto.MGMessages.MG_COMPUTE_RESULT:
                    message = proto.MGComputeResult.deserializeBinary(bytes.slice(2, 2 + size));
                    pool.onResult(id, message);
                    break;
                case proto.MGMessages.MG_END:
                    message = proto.MGEnd.deserializeBinary(bytes.slice(2, 2 + size));
                    break;

             }
             log.verbose(message);
        });

        sock.on('close', function(data) {
            log.verbose(`We received a close from ${id}`);
            dispose(id);
        });

    }).listen('4567', '127.0.0.1');
    log.info("WebSocket server is alive on port 4567");
}

function sendTo(id, messageType, message) {
    const buf = Buffer.alloc(2);
    const mArray = message.serializeBinary();
    buf[0] = messageType;
    buf[1] = mArray.length;
    connections[id].write(buf);
    connections[id].write(Buffer.from(mArray));
}

module.exports.sendTo = sendTo;
module.exports.init = init;
