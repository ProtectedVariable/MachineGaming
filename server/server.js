const mgproto = require('./protobuf/mg_pb.js');
const mgnetwork = require('./mgnetwork.js')
const mgpool = require('./pool.js');
const genetic = require('./genetic.js');
const express = require('express');
const cors = require('cors');
const log = require('winston');
const mongoose = require('mongoose');
const app = express();
const bodyParser = require('body-parser');
const pool = new mgpool.Pool(100);


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
        "currentFitness": pool.currentFitness,
        "remainingCycles": pool.targetCycles - pool.cycles
    });
});

app.get('/status', (req, res) => {
	res.json({
        "workers": pool.workers,
        "games": games,
        "currentGame": pool.currentGame,
        "currentFitness": pool.currentFitness,
        "remainingCycles": isFinite(pool.targetCycles) ? pool.targetCycles - pool.cycles : "Infinity",
        "fitnesses": pool.fitnesses
    });
});

app.post('/task', (req, res) => {
    if(req.body.pause != null) {
        pool.pauseTask();
    } else {
        Game.find({_id: req.body.game}, function(err, result) {
            let n = (req.body.infgen != null ? Infinity : (req.body.onegen != null ? 1 : 100));
            pool.newTask(result[0].name, result[0].fitness, n);
        });
    }
    res.redirect("/");
});

app.listen(8080,  () => {
    log.info(`Express running → ADDRESS http://localhost:8080`);
});
