const mgclient = require('./client.js');
const mgnetwork = require('./mgnetwork.js');
const proto = require('./protobuf/mg_pb.js');
const genetic = require('./genetic.js');

function Pool(population) {
    this.workers = {};
    this.genomes = [];
    this.fitnesses = [];
    this.genomes = [];
    this.cycles = 0;
    this.targetCycles = 0;
    this.population = population;
    this.currentGame = "-";
    this.currentFitness = "-";
    this.currentType = genetic.GenomeType.MULTILAYER_PERCEPTRON;
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

Pool.prototype.createInitialPopulation = function(genomeType, netMetadata) {
    this.genomes = genetic.createRandomGeneration(genomeType, this.population, netMetadata);
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
                    request.setNetType(this.currentType == genetic.GenomeType.MULTILAYER_PERCEPTRON ? proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON : proto.MGNetworkType.MG_NEAT);
                    request.setNetMetadata(genetic.metadataString(genetic.NetworkMetadata[0]))
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
        this.fitnesses[this.cycles - 1] = this.genomes.map(x => x.fitness).reduce((a,c) => a + c) / this.population;

        //Regen genomes
        for (let i = 0; i < this.genomes.length; i++) {
            this.genomes[i].computing = false;
        }
        genetic.createNextGeneration(this.genomes, this.currentType, 0.1)
        //Reset client state
        for (let index in this.workers) {
            this.workers[index].busy = false;
        }

        this.sendTasksToClients();
    }
}

Pool.prototype.pauseTask = function() {
    this.targetCycles = this.cycles + 1;
    this.sendTasksToClients();
};

module.exports.Pool = Pool;
