const mgclient = require('./client.js');
const mgnetwork = require('./mgnetwork.js');
const proto = require('./protobuf/mg_pb.js');

function Pool(population) {
    this.workers = {};
    this.genomes = [];
    for(let i = 0; i < population; i++) {
        this.genomes.push({code: "", computing: false, fitness: 0}); //Empty genome
    }
    this.cycles = 0;
    this.targetCycles = 0;
    this.population = population;
    this.currentGame = "-";
    this.currentFitness = "-";
    this.idle = true;
    this.computingGenomes = 0;
}

Pool.prototype.addWorker = function(id, name) {
    this.workers[id] = new mgclient.Client(name);
    if(!this.idle) {
        this.sendTasksToClients();
    }
}

Pool.prototype.removeWorker = function(id) {
    delete this.workers[id];
}

Pool.prototype.newTask = function(game, fitness, numGens) {
    if(!this.idle)
        return;
    this.currentGame = game;
    this.currentFitness = fitness;
    this.targetCycles = this.cycles + numGens;
    this.idle = false;
    this.computingGenomes = 0;
    this.sendTasksToClients();
};

Pool.prototype.onResponse = function(id, message) {
    if(message.getCanDo() != true) {
        this.workers[id].status = "Unable to compute";
        this.workers[id].busy = false;
    } else {
        this.workers[id].status = "Computing...";
        this.workers[id].busy = true;
        this.genomes[this.workers[id].genomeID].computing = true;
    }
}

Pool.prototype.onResult = function(id, message) {
    this.workers[id].status = "Waiting...";
    this.workers[id].busy = false;
    this.genomes[this.workers[id].genomeID].fitness = message.getFitness();
    this.sendTasksToClients();
}

Pool.prototype.sendTasksToClients = function() {
    let allDone = false;

    for (let index in this.workers) {
        let w = this.workers[index];
        if(w.busy == false) {
            allDone = true;
            for (let i = 0; i < this.genomes.length; i++) {
                if(this.genomes[i].computing == false) {
                    allDone = false;
                    w.genomeID = i;
                    let computeInfo = new proto.MGComputeInfo();
                    computeInfo.setGame(this.currentGame);
                    computeInfo.setFitness(this.currentFitness);
                    let request = new proto.MGComputeRequest();
                    request.setComputeInfo(computeInfo);
                    request.setGenome(this.genomes[i].code);
                    mgnetwork.sendTo(index, proto.MGMessages.MG_COMPUTE_REQUEST, request);
                    w.busy = true;
                    break;
                }
            }
        }
    }

    if(allDone) {
        this.cycles++;
        this.idle = (this.cycles == this.targetCycles);
    }
}

Pool.prototype.pauseTask = function() {
    this.targetCycles = this.cycles + 1;
};

module.exports.Pool = Pool;
