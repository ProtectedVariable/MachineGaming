/**
 * This module handles the workers pool, and distributes the work
 *
 * @author Thomas Ibanez
 * @version 1.0
 */
"use strict";
const mgclient = require('./client.js');
const mgnetwork = require('./mgnetwork.js');
const proto = require('./protobuf/mg_pb.js');
const genetic = require('./genetic.js');

function Pool(population) {
    this.workers = {};
    this.spectators = {};
    this.species = [];
    this.genomes = [];
    this.avgFitnesses = [];
    this.bestFitnesses = [];
    this.cycles = 0;
    this.targetCycles = 0;
    this.population = population;
    this.currentGame = "-";
    this.currentType = proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON;
    this.currentTopo = "";
    this.idle = true;
    this.computingGenomes = 0;
}

/**
 * Adds a worker to the pool
 * @param  {String} id   id of the worker
 * @param  {String} name Name of the worker
 */
Pool.prototype.addWorker = function(id, name) {
    this.workers[id] = new mgclient.Client(name);
    if(!this.idle) {
        this.sendTasksToClients();
    }
}

/**
 * Removes a worker from the pool
 * @param  {String} id id of the worker
 */
Pool.prototype.removeWorker = function(id) {
    if(this.workers[id] != undefined && this.workers[id].busy) {
        this.genomes[this.workers[id].genomeID].computing = false;
        this.genomes[this.workers[id].genomeID].waiting = false;
    }
    delete this.workers[id];
    delete this.spectators[id];
}

/**
 * Adds a spectator
 * @param  {[type]} id   Id of the spectator
 * @param  {[type]} name Name of the spectator
 */
Pool.prototype.addSpectator = function(id, name) {
    this.spectators[id] = new mgclient.Client(name);
}

/**
 * Initalizes the pool with a random population made for the selected task
 */
Pool.prototype.createInitialPopulation = function() {
    this.genomes = genetic.createRandomGeneration(this.currentType, this.population, this.currentTopo);
}

/**
 * Launches a new task for a given number of generations
 * @param  {Number} numGens Number of generations to make, you can use Infinity
 */
Pool.prototype.newTask = function(numGens) {
    if(!this.idle || this.currentGame == "-")
        return;
    this.targetCycles = this.cycles + numGens;
    this.idle = false;
    this.computingGenomes = 0;
    this.sendTasksToClients();
};

/**
 * Lock the selected task infos
 * @param  {String} game Game to play
 * @param  {Number} type Network type
 * @param  {Object} topo Network topology
 */
Pool.prototype.lockInfo = function(game, type, topo) {
    if(!this.idle)
        return;
    if(this.currentGame != "-") {
        this.currentGame = "-";
    } else {
        this.currentGame = game;
        this.currentType = type;
        this.currentTopo = topo;
        this.avgFitnesses = [];
        this.bestFitnesses = [];
        this.cycles = 0;
        this.targetCycles = 0;
        this.createInitialPopulation();
    }
};

/**
 * Response callback
 * @param  {String} id      Worker ID
 * @param  {MGComputeResponse} message Message content
 */
Pool.prototype.onResponse = function(id, message) {
    if(message.getCanDo() != true) {
        this.workers[id].status = "Unable to compute";
        this.workers[id].busy = false;
    } else {
        this.workers[id].status = "Computing...";
        this.workers[id].busy = true;
        this.genomes[this.workers[id].genomeID].computing = true;
    }
    this.genomes[this.workers[id].genomeID].waiting = false;
}

/**
 * Result callback
 * @param  {String} id      Worker ID
 * @param  {MGComputeResult} message Message content
 */
Pool.prototype.onResult = function(id, message) {
    this.workers[id].status = "Waiting...";
    this.workers[id].busy = false;
    this.genomes[this.workers[id].genomeID].fitness = message.getFitness();
    this.genomes[this.workers[id].genomeID].unajustedFitness = message.getFitness();
    this.sendTasksToClients();
}

/**
 * Distributes work to clients
 */
Pool.prototype.sendTasksToClients = function() {
    let allDone = false;

    for (let index in this.workers) {
        let w = this.workers[index];
        if(w.busy == false) {
            allDone = true;
            for (let i = 0; i < this.genomes.length; i++) {
                if(this.genomes[i].fitness == -1) {
                    allDone = false;
                }
                if(this.genomes[i].computing == false && !this.genomes[i].waiting) {
                    allDone = false;
                    this.genomes[i].waiting = true;
                    w.genomeID = i;
                    let computeInfo = new proto.MGComputeInfo();
                    computeInfo.setGame(this.currentGame);
                    computeInfo.setNetType(this.currentType);
                    computeInfo.setNetMetadata(genetic.metadataFromTopology(this.currentTopo));
                    let request = new proto.MGComputeRequest();
                    request.setComputeInfo(computeInfo);
                    request.setGenome(genetic.genomeString(this.genomes[i], this.currentType));
                    mgnetwork.sendTo(index, proto.MGMessages.MG_COMPUTE_REQUEST, request);
                    w.busy = true;
                    break;
                }
            }
        }
    }

    if(allDone && !this.idle) {
        this.cycles++;
        this.idle = (this.cycles == this.targetCycles);
        //Compute generation's average fitness
        this.avgFitnesses[this.cycles - 1] = this.genomes.map(x => x.unajustedFitness).reduce((a,c) => a + c) / this.population;
        //Get best fitness
        this.bestFitnesses[this.cycles - 1] = this.genomes.map(x => x.unajustedFitness).reduce((a, c) => (a > c) ? a : c);

        let best = this.genomes.reduce((a, c) => (a.unajustedFitness > c.unajustedFitness) ? a : c);
        let computeInfo = new proto.MGComputeInfo();
        computeInfo.setGame(this.currentGame);
        computeInfo.setNetType(this.currentType);
        computeInfo.setNetMetadata(genetic.metadataFromTopology(this.currentTopo));
        let request = new proto.MGComputeRequest();
        request.setComputeInfo(computeInfo);
        request.setGenome(genetic.genomeString(best, this.currentType));
        for (var a in this.spectators) {
            mgnetwork.sendTo(a, proto.MGMessages.MG_COMPUTE_REQUEST, request);
        }

        //Regen genomes
        this.genomes = genetic.createNextGeneration(this.genomes, this.currentType);
        //Reset client state
        for (let index in this.workers) {
            this.workers[index].busy = false;
        }
        if(!this.idle) {
            this.sendTasksToClients();
        }
    }
}

/**
 * Pauses the current task
 */
Pool.prototype.pauseTask = function() {
    this.targetCycles = this.cycles + 1;
    this.sendTasksToClients();
};

module.exports.Pool = Pool;
