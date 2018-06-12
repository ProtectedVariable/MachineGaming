/**
 * This module handles all the network communications for machine gaming
 *
 * @author Thomas Ibanez
 * @version 1.0
 */
"use strict";
const net = require('net');
const uuid = require("uuid/v1");
const log = require('winston');
const mgpool = require('./pool.js');
const mgproto = require('./protobuf/mg_pb.js');
const client = require('./client.js');

let connections = [];
let pool = null;

/**
 * Handles the desire to join from a client
 * @param  {String} id      The unique client id
 * @param  {MGJoin} message The join message sent by the client
 */
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

/**
 * Removes all of the resources used for a client
 * @param  {String} id ID of the client
 */
function dispose(id) {
    pool.removeWorker(id);
	if (connections[id] !== undefined)
		connections[id].destroy();
	delete connections[id];
}

/**
 * Initialize server socket to accept connections
 * @param  {Object} _pool The worker pool
 */
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

/**
 * Sends a message to a client
 * @param  {String} id          Id of the client
 * @param  {Number} messageType Type of the message to send
 * @param  {Object} message     Object of the message made with protobuf
 */
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
