const mgproto = require('./protobuf/mg_pb.js');
const client = require('./client.js');
const mgpool = require('./pool.js');
const genetic = require('./genetic.js');
const net = require('net');
const uuid = require("uuid/v1");
const express = require('express');
const cors = require('cors');
const log = require('winston');
const mongoose = require('mongoose');
const app = express();
const pool = new mgpool.Pool(100);
const bodyParser = require('body-parser');

log.level = 'debug';
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect('mongodb://localhost/mg');
let db = mongoose.connection;
let games = [];
db.on('error', console.error.bind(console, 'connection error:'));
let gameSchema = mongoose.Schema({
    _id: Number,
    name: String,
    fitness: String
});
let Game = mongoose.model('Game', gameSchema);
db.once('open', function() {
    Game.find({_id: 0}, function(err, result) {
        if(result.length == 0) {
            let asteroidTime = new Game({_id: 0, name: "Asteroid", fitness: "Time"});
            asteroidTime.save(function (err, asteroidTime) {
                if (err) return console.error(err);
            });
        }
    });

    Game.find({}, function(err, result) {
        games = result;
    });
});

let connections = [];

app.set('view engine', 'pug');
app.set('view options', {"pretty": true});
app.locals.pretty = true;

app.get('/', (req, res) => {
	res.render('main', { "workers": pool.workers, "games": games, "currentGame": pool.currentGame, "currentFitness": pool.currentFitness, "remainingCycles": pool.targetCycles - pool.cycles })
});

app.post('/task', (req, res) => {
    Game.find({_id: req.body.game}, function(err, result) {
        let n = (req.body.infgen != null ? Infinity : (req.body.onegen != null ? 1 : 100));
        pool.newTask(result[0].name, result[0].fitness, n);
        res.redirect("/");
    });
});

app.listen(8080,  () => {
    log.info(`Express running → ADDRESS http://localhost:8080`);
});

function dispose(id) {
    pool.removeWorker(id);
	if (connections[id] !== undefined)
		connections[id].destroy();
	delete connections[id];
}

function sendTo(id, messageType, message) {
    const buf = Buffer.alloc(2);
    const mArray = message.serializeBinary();
    buf[0] = messageType;
    buf[1] = mArray.length;
    connections[id].write(buf);
    connections[id].write(Buffer.from(mArray));
}

function handleJoin(id, message) {
    let response = new proto.MGJoinResponse();
    //Always accepted
    response.setAccepted(true);
    sendTo(id, proto.MGMessages.MG_JOIN_RESPONSE, response);
    pool.addWorker(id, message.getPrettyName());
}


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
            case proto.MGMessages.MG_COMPUTE_RESULT:
                message = proto.MGComputeResult.deserializeBinary(bytes.slice(2, 2 + size));
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
