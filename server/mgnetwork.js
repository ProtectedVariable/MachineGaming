"use strict";
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
    if(message.getSpectator() == true) {
        pool.addSpectator(id, message.getPrettyName());
    } else {
        pool.addWorker(id, message.getPrettyName());
    }
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

        sock.on("error", function(err) {
            dispose(id);
            console.log("Caught flash policy server socket error: ");
            console.log(err.stack);
        });

        sock.on('data', function(data) {
            let bytes = Array.prototype.slice.call(data, 0);
            let offset = 0;
            do {
                let type = bytes[offset];
                let size = bytes[offset + 1];
                let message = null;
                switch(type) {
                    case proto.MGMessages.MG_JOIN:
                        if(!joined) {
                            message = proto.MGJoin.deserializeBinary(bytes.slice(offset + 2, offset + 2 + size));
                            handleJoin(id, message);
                            joined = true;
                        }
                        break;
                    case proto.MGMessages.MG_COMPUTE_RESPONSE:
                        message = proto.MGComputeResponse.deserializeBinary(bytes.slice(offset + 2, offset + 2 + size));
                        pool.onResponse(id, message);
                        break;
                    case proto.MGMessages.MG_COMPUTE_RESULT:
                        message = proto.MGComputeResult.deserializeBinary(bytes.slice(offset + 2, offset + 2 + size));
                        pool.onResult(id, message);
                        break;
                    case proto.MGMessages.MG_END:
                        message = proto.MGEnd.deserializeBinary(bytes.slice(offset + 2, offset + 2 + size));
                        break;

                 }
                 offset += size + 2;
             } while(offset < bytes.length);
        });

        sock.on('close', function(data) {
            log.verbose(`We received a close from ${id}`);
            dispose(id);
        });

    }).listen('4567', '127.0.0.1');
    log.info("WebSocket server is alive on port 4567");
}

function sendTo(id, messageType, message) {
    const buf = Buffer.alloc(5, 0);
    buf[0] = messageType;
    const mArray = message.serializeBinary();
    buf.writeUInt32BE(mArray.length, 1);
    if(connections[id] !== undefined) {
        connections[id].write(buf);
        connections[id].write(Buffer.from(mArray));
    }
}

module.exports.sendTo = sendTo;
module.exports.init = init;
