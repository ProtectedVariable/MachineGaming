"use strict";
const proto = require('./protobuf/mg_pb.js');
const mgnetwork = require('./mgnetwork.js')
const mgpool = require('./pool.js');
const genetic = require('./genetic.js');
const express = require('express');
const cors = require('cors');
const log = require('winston');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const pool = new mgpool.Pool(500);

log.level = 'debug';
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect('mongodb://localhost/mg');
let db = mongoose.connection;
let games = [
    {
        id: 0,
        name: "Asteroid"
    }
];
let topos = [
    {
        gameId: 0,
        netType: proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON,
        netMetadata: {
            inputCount: 8,
            hLayerCount: 2,
            hLayers: [12, 8],
            outputCount: 4
        }
    },
    {
        gameId: 0,
        netType: proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON,
        netMetadata: {
            inputCount: 8,
            hLayerCount: 1,
            hLayers: [12],
            outputCount: 4
        }
    },
    {
        gameId: 0,
        netType: proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON,
        netMetadata: {
            inputCount: 8,
            hLayerCount: 4,
            hLayers: [12, 10, 8, 6],
            outputCount: 4
            }
    },
    {
        gameId: 0,
        netType: proto.MGNetworkType.MG_NEAT,
        netMetadata: {
            inputCount: 8,
            hLayerCount: 0,
            outputCount: 4
        }
    }
];
db.on('error', console.error.bind(console, 'connection error:'));

let genSchema = mongoose.Schema({
    batchId: Number,
    genNumber: Number,
    game: String,
    avgFitness: Number,
    bestFitness: Number,
    species: [[]]
});
let Gen = mongoose.model('Generation', genSchema);
db.once('open', function() {

});

app.set('view engine', 'pug');
app.set('view options', {"pretty": true});
app.use('/scripts', express.static(__dirname + '/scripts/'));
app.locals.pretty = true;

mgnetwork.init(pool);

app.get('/', (req, res) => {
	res.render('main', {
        "workers": pool.workers,
        "games": games,
        "currentGame": pool.currentGame,
        "remainingCycles": pool.targetCycles - pool.cycles,
        "topologies": topos
    });
});

app.get('/status', (req, res) => {
	res.json({
        "workers": pool.workers,
        "games": games,
        "currentGame": pool.currentGame,
        "currentFitness": pool.currentFitness,
        "remainingCycles": isFinite(pool.targetCycles) ? pool.targetCycles - pool.cycles : "Infinity",
        "avgFitnesses": pool.avgFitnesses.slice(pool.avgFitnesses.length < 50 ? 0 : pool.avgFitnesses.length - 50, pool.avgFitnesses.length),
        "bestFitnesses": pool.bestFitnesses.slice(pool.bestFitnesses.length < 50 ? 0 : pool.bestFitnesses.length - 50, pool.bestFitnesses.length)
    });
});

app.post('/task', (req, res) => {
    if(req.body.pause != null) {
        pool.pauseTask();
    } else {
        let n = (req.body.infgen != null ? Infinity : (req.body.onegen != null ? 1 : 100));
        pool.newTask(n);
    }
    res.redirect("/");
});

app.post('/work', (req, res) => {
    if(req.body.lock) {
        pool.lockInfo(games[req.body.tgame].name, req.body.tnet, topos[req.body.ttopo % 1000].netMetadata);
        console.log(topos[req.body.ttopo % 1000].netMetadata);
    }
    res.redirect("/");
});

app.listen(8080,  () => {
    log.info("Express running → ADDRESS http://localhost:8080");
});
