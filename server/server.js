/**
 * This module handles web-client requests
 *
 * @author Thomas Ibanez
 * @version 1.0
 */
"use strict";
const proto = require('./protobuf/mg_pb.js');
const mgnetwork = require('./mgnetwork.js')
const mgpool = require('./pool.js');
const mgNEAT = require('./neat.js')
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
    topoID: Number,
    avgFitnesses: [Number],
    bestFitnesses: [Number],
    genomes: [String],
    species: [{
        bestFitness: Number,
        best: String,
        staleness: Number,
        averageFitness: Number
    }],
    innovationHistory: [{
        from: Number,
        to: Number,
        innovationNumber: Number,
        innovationNumbers: [Number]
    }]
});
let saved = [];
let Gen = mongoose.model('Generation', genSchema);
db.once('open', function() {
    Gen.find(function (err, gens) {
        saved = gens;
    });
});

app.set('view engine', 'pug');
app.set('view options', {"pretty": true});
app.use('/scripts', express.static(__dirname + '/scripts/'));
app.locals.pretty = true;

mgnetwork.init(pool);

let topoID = 0;

app.get('/', (req, res) => {
	res.render('main', {
        "workers": pool.workers,
        "games": games,
        "currentGame": pool.currentGame,
        "currentTopo": topoID,
        "currentType": pool.currentType,
        "remainingCycles": pool.targetCycles - pool.cycles,
        "topologies": topos,
        "saves": saved
    });
});

app.get('/status', (req, res) => {
	res.json({
        "workers": pool.workers,
        "games": games,
        "currentGame": pool.currentGame,
        "currentGeneration": pool.cycles,
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
        if(pool.currentGame == "-") {
            pool.lockInfo(games[req.body.tgame].name, req.body.tnet, topos[req.body.ttopo % 1000].netMetadata);
            topoID = req.body.ttopo;
        } else {
            pool.lockInfo(null, null, null);
        }
    } else if(req.body.save) {
        let current = new Gen({
            batchId: Math.floor((new Date).getTime() / 1000),
            genNumber: pool.cycles,
            topoID: topoID,
            avgFitnesses: pool.avgFitnesses,
            bestFitnesses: pool.bestFitnesses,
            genomes: pool.genomes.map(x => JSON.stringify(x)),
            species: mgNEAT.getSpecies().map(x => {return {bestFitness: x.bestFitness, best: JSON.stringify(x.best), staleness: x.staleness, averageFitness: x.averageFitness}}),
            innovationHistory: mgNEAT.getInnovationHistory()
        });
        current.save(function(err) {
            Gen.find(function (err, gens) {
                saved = gens;
            });
        });
    } else if(req.body.load) {
        Gen.findOne({ batchId: req.body.lbatch }).lean().exec(function(err, result) {
            pool.lockInfo(games[topos[result.topoID % 1000].gameId].name, topos[result.topoID % 1000].netType, topos[result.topoID % 1000].netMetadata);
            topoID = result.topoID;
            pool.cycles = result.genNumber,
            pool.targetCycles = result.genNumber,
            pool.avgFitnesses = result.avgFitnesses,
            pool.bestFitnesses = result.bestFitnesses,
            pool.genomes = result.genomes.map(x => JSON.parse(x));
            mgNEAT.setSpecies(result.species.map(x =>
                {
                    let s = new mgNEAT.Specie(JSON.parse(x.best));
                    s.staleness = x.staleness;
                    s.averageFitness = x.averageFitness;
                    return s;
                }
            ));
            mgNEAT.setInnovationHistory(result.innovationHistory);
        });
    } else if(req.body.regen) {
        pool.createInitialPopulation();
        pool.sendTasksToClients();
    }
    res.redirect("/");
});

app.listen(8080,  () => {
    log.info("Express running → ADDRESS http://localhost:8080");
});
