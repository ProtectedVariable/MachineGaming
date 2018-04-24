const mgproto = require('./protobuf/mg_pb.js');
const pool = require('./pool.js').Pool();
const genetic = require('./genetic.js');
const net = require('net');
const uuid = require("uuid/v1");
const express = require('express');
const cors = require('cors');
const log = require('winston');
const app = express();

log.level = 'debug';
app.use(cors());

let connections = [];

function dispose(id) {
	if (connections[id] !== undefined)
		connections[id].destroy();
	delete connections[id];
}


net.createServer(function(sock) {
    let id = uuid();
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
                message = proto.MGJoin.deserializeBinary(bytes.slice(2, bytes.length));
                break;
            case proto.MGMessages.MG_COMPUTE_RESULT:
                message = proto.MGComputeResult.deserializeBinary(bytes.slice(2, bytes.length));
                break;
            case proto.MGMessages.MG_END:
                message = proto.MGEnd.deserializeBinary(bytes.slice(2, bytes.length));
                break;
         }
    });

    sock.on('close', function(data) {
        log.verbose(`We received a close from ${id}`);
        dispose(id);
    });

}).listen('4567', '127.0.0.1');
log.info("WebSocket server is alive on port 4567");
