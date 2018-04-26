const mgclient = require('./client.js');

function Pool(population) {
    this.workers = {};
    this.cycles = 0;
    this.targetCycles = 0;
    this.population = population;
    this.currentGame = "-";
    this.currentFitness = "-";
}

Pool.prototype.addWorker = function(id, name) {
    this.workers[id] = new mgclient.Client(name);
}

Pool.prototype.removeWorker = function(id) {
    delete this.workers[id];
}

Pool.prototype.newTask = function(game, fitness, numGens) {
    this.currentGame = game;
    this.currentFitness = fitness;
    this.targetCycles = this.cycles + numGens;
};

module.exports.Pool = Pool;
