"use strict";
const genetic = require("./genetic.js")

let nextConnectionNo = 1000;
let species = [];
let innovationHistory = [];

function createNextGeneration(genomes) {
    let nextgen = [];
    speciate(genomes);
    species.sort(function(a, b) { //Sort greater fitness first
        if(a.bestFitness < b.bestFitness) {
            return 1;
        } else if(a.bestFitness > b.bestFitness) {
            return -1;
        }
        return 0;
    });
    cullSpecies();
    killStaleSpecies();
    killBadSpecies(genomes.length);
    let averageSum = getAvgFitnessSum();
    for (let i in species) {
        nextgen.push(species[i].genomes[0]);
        let childAlloc = Math.floor(species[i].averageFitness / averageSum * genomes.length) - 1;
        for (let j = 0; j < childAlloc; j++) {
            nextgen.push(species[i].yieldChild());
        }
    }
    for(let i = nextgen.length; i < genomes.length; i++) {
        nextgen.push(species[0].yieldChild());
    }
    for(let i in nextgen) {
        nextgen[i].fitness = -1;
        nextgen[i].computing = false;
    }
    return nextgen;
}

function speciate(genomes) {
    for(let i in species) {
        species[i].clear();
    }
    for(let i in genomes) {
        let speciesFound = false;
        for(let j in species) {
            if(species[j].sameSpecies(genomes[i])) {
                species[j].addToSpecies(genomes[i]);
                speciesFound = true;
                break;
            }
        }
        if(!speciesFound) {
            species.push(new Specie(genomes[i]));
        }
    }
    for(let i in species) {
        species[i].genomes.sort(function(a, b) { //Sort greater fitness first
            if(a.fitness < b.fitness) {
                return 1;
            } else if(a.fitness > b.fitness) {
                return -1;
            }
            return 0;
        });
    }
}

function cullSpecies() {
    for (let i in species) {
        species[i].cull();
        species[i].fitnessSharing();
        species[i].setAverage();
    }
}

function killStaleSpecies() {
    for (let i = 0; i < species.length; i++) {
        if (species[i].staleness >= 15) {
            species.splice(i, 1);
            i--;
        } else {
            species[i].staleness++;
        }
    }
}

function killBadSpecies(population) {
    let averageSum = getAvgFitnessSum();

    for(let i = 0; i < species.length; i++) {
        if(species[i].averageFitness / averageSum * population < 1) {
            species.splice(i, 1);
            i--;
        }
    }
}

function getAvgFitnessSum() {
    return species.map(x => x.averageFitness).reduce((a, c) => a + c);
}

function crossover(g1, g2) {
    let child = {
        genes: [],
        nodes: [],
        inputs: g1.inputs,
        outputs: g1.outputs,
        layers: g1.layers,
        nextNode: g1.nextNode,
        biasNode: g1.biasNode,
        computing: false,
        fitness: -1
    };

    let childGenes = [];
    let enabledGenes = [];

    for(let i in g1.genes) {
        let enabled = true;

        let parent2gene = matchingGene(g2, g1.genes[i].innovationNo);
        if (parent2gene != -1) {
            if (!g1.genes[i].enabled || !g2.genes[parent2gene].enabled) {
                if (Math.random() < 0.75) {
                    enabled = false;
                }
            }
            if (Math.random() < 0.5) {
                childGenes.push(g1.genes[i]);
            } else {
                childGenes.push(g2.genes[parent2gene]);
            }
        } else {
            childGenes.push(g1.genes[i]);
            enabled = g1.genes[i].enabled;
        }
        enabledGenes.push(enabled);
    }

    for (let i in g1.nodes) {
        child.nodes.push({no: g1.nodes[i].no, layer: g1.nodes[i].layer});
    }

    for(let i in childGenes) {
        child.genes.push({from: childGenes[i].from, to: childGenes[i].to, weight: childGenes[i].weight, innovationNo: childGenes[i].innovationNo, enabled: true});
        child.genes[i].enabled = enabledGenes[i];
    }
    return child;
}

function matchingGene(g, inno) {
    for (let i in g.genes) {
        if (g.genes[i].innovationNo == inno) {
            return i;
        }
    }
    return -1;
}

function mutate(g) {
    if (Math.random() < 0.8) {
        for(let i in g.genes) {
            g.genes[i].weight = mutateWeight(g.genes[i].weight);
        }
    }

    if (Math.random() < 0.05) {
        addConnection(g);
    }

    if (Math.random() < 0.03) {
        addNode(g);
    }
}

function addNode(g) {
    let randomConnection = 0; //The loop will assign the real value

    let availableConnection = false;
    for(let i in g.genes) {
        if(g.genes[i].from != g.biasNode) {
            availableConnection = true;
            break;
        }
    }

    if(availableConnection) {
        do {
            randomConnection = Math.floor(Math.random() * (g.genes.length));
        } while(g.genes[randomConnection].from == g.biasNode); //Do not disconnect bias !

        g.genes[randomConnection].enabled = false;

        let newNodeNo = g.nextNode;
        g.nextNode++;

        let connectionInnovationNumber = getInnovationNumber(g, g.genes[randomConnection].from, newNodeNo);
        g.genes.push({from: g.genes[randomConnection].from, to: newNodeNo, weight: 1, innovationNo: connectionInnovationNumber, enabled: true});


        connectionInnovationNumber = getInnovationNumber(g, newNodeNo, g.genes[randomConnection].to);

        g.genes.push({from: newNodeNo, to: g.genes[randomConnection].to, weight: g.genes[randomConnection].weight, innovationNo: connectionInnovationNumber, enabled: true});
        g.nodes.push({no: newNodeNo, layer: getNode(g, g.genes[randomConnection].from).layer + 1});

        connectionInnovationNumber = getInnovationNumber(g, g.biasNode, newNodeNo);

        g.genes.push({from: g.biasNode, to: newNodeNo, weight: 0, innovationNo: connectionInnovationNumber, enabled: true});

        if(getNode(g, newNodeNo).layer == getNode(g, g.genes[randomConnection].to).layer) {
            for (let i in g.nodes) {
                if (g.nodes[i].no != newNodeNo && g.nodes[i].layer >= getNode(g, newNodeNo).layer) {
                    g.nodes[i].layer++;
                }
            }
            g.layers++;
        }
    }
}

function getNode(g, id) {
    for(let i in g.nodes) {
        if(g.nodes[i].no == id) {
            return g.nodes[i];
        }
    }
}

function addConnection(g) {
    if (fullyConnected(g)) {
        //Cannot add a connection to a full network
        return;
    }
    let randomNode1 = Math.floor(Math.random() * (g.nodes.length));
    let randomNode2 = Math.floor(Math.random() * (g.nodes.length));
    while (g.nodes[randomNode1].layer == g.nodes[randomNode2].layer || nodesConnected(g, g.nodes[randomNode1], g.nodes[randomNode2])) {
        randomNode1 = Math.floor(Math.random() * (g.nodes.length));
        randomNode2 = Math.floor(Math.random() * (g.nodes.length));
    }
    if (g.nodes[randomNode1].layer > g.nodes[randomNode2].layer) {
        let temp = randomNode2;
        randomNode2 = randomNode1;
        randomNode1 = temp;
    }
    let connectionInnovationNumber = getInnovationNumber(g, g.nodes[randomNode1].no, g.nodes[randomNode2].no);
    g.genes.push({from: g.nodes[randomNode1].no, to: g.nodes[randomNode2].no, weight: Math.random() * 2 - 1, innovationNo: connectionInnovationNumber, enabled: true});
}

function nodesConnected(g, a, b) {
    for(let i in g.genes) {
        if(g.genes[i].from == a.no && g.genes[i].to == b.no) {
            return true;
        } else if(g.genes[i].from == b.no && g.genes[i].to == a.no) {
            return true;
        }
    }
    return false;
}

function fullyConnected(g) {
    let maxConnections = 0;
    let nodesInLayers = Array.apply(null, Array(g.layers)).map(Number.prototype.valueOf, 0);

    for (let i in g.nodes) {
        nodesInLayers[g.nodes[i].layer] += 1;
    }

    for (let i = 0; i < g.layers - 1; i++) {
        let nodesInFront = 0;
        for (let j = i + 1; j < g.layers; j++) {
            nodesInFront += nodesInLayers[j];
        }

        maxConnections += nodesInLayers[i] * nodesInFront;
    }
    return maxConnections == g.genes.length;
}

function mutateWeight(w) {
    if(Math.random() < 0.1) {
        return Math.random() * 2 - 1;
    } else {
        let neww = w + ((Math.random() - 0.5) / 50);
        if(neww > 1) {
            neww = 1;
        } else if(neww < -1){
            neww = -1;
        }
        return neww;
    }
}

function getInnovationNumber(g, from, to) {
    let isNew = true;
    let connectionInnovationNumber = nextConnectionNo;
    for(let i in innovationHistory) {
        if(innovationMatches(g, innovationHistory[i], from, to)) {
            isNew = false;
            connectionInnovationNumber = innovationHistory[i].innovationNumber;
        }
    }

    if(isNew) {
        let innoNumbers = [];
        for(let i in g.genes) {
            innoNumbers.push(g.genes[i].innovationNo);
        }
        innovationHistory.push({from: from, to: to, innovationNumber: connectionInnovationNumber, innovationNumbers: innoNumbers});
        nextConnectionNo++;
    }
    return connectionInnovationNumber;
}

function innovationMatches(g, innovation, from, to) {
    if (g.genes.length == innovation.innovationNumbers.length) {
        if (from == innovation.from && to == innovation.to) {
            for (let i in g.genes) {
                if (!innovation.innovationNumbers.includes(g.genes[i].innovationNo)) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
}

const excessCoeff = 1.5;
const weightDiffCoeff = 0.8;
const compatibilityThreshold = 1;

function Specie(genome) {
    this.genomes = [genome];
    this.bestFitness = genome.fitness;
    this.best = genome;
    this.staleness = -1;
    this.averageFitness = 0;
}

Specie.prototype.sameSpecies = function(genome) {
    let excessAndDisjoint = this.getExcessDisjoint(genome, this.best);
    let averageWeightDiff = this.averageWeightDiff(genome, this.best);
    let largeGenomeNormaliser = 1;

    let compatibility = (excessCoeff * excessAndDisjoint / largeGenomeNormaliser) + (weightDiffCoeff * averageWeightDiff);
    return (compatibilityThreshold > compatibility);
}

Specie.prototype.getExcessDisjoint = function(g1, g2) {
    let matching = 0;
    for (let i in g1.genes) {
        for (let j in g2.genes) {
            if(g1.genes[i].innovationNo == g2.genes[j].innovationNo) {
                matching++;
                break;
            }
        }
    }
    return (g1.genes.length + g2.genes.length - 2 * matching);
}

Specie.prototype.averageWeightDiff = function(g1, g2) {
    let matching = 0;
    let totalDiff = 0;
    for(let i in g1.genes) {
        for(let j in g2.genes) {
            if(g1.genes[i].innovationNo == g2.genes[j].innovationNo) {
                matching++;
                totalDiff += Math.abs(g1.genes[i].weight - g2.genes[j].weight);
                break;
            }
        }
    }
    return (matching == 0 ? 100 : (totalDiff / matching));
}

Specie.prototype.addToSpecies = function(genome) {
    this.genomes.push(genome);
    if(genome.fitness > this.bestFitness) {
        this.bestFitness = genome.fitness;
        this.best = genome;
        this.staleness = -1; //The staleness is going to be incremented back to 0 anyways
    }
}

Specie.prototype.setAverage = function() {
    this.averageFitness = this.genomes.length != 0 ? this.genomes.map(x => x.fitness).reduce((a, c) => a + c) / this.genomes.length : 0;
}

Specie.prototype.cull = function() {
    if(this.genomes.length > 2) {
        this.genomes.splice(Math.floor(this.genomes.length / 2 + 1), Math.floor(this.genomes.length / 2));
    }
}

Specie.prototype.fitnessSharing = function() {
    for (let i in this.genomes) {
        this.genomes[i].fitness /= this.genomes.length;
    }
}

Specie.prototype.clear = function() {
    this.genomes = [];
}

Specie.prototype.yieldChild = function() {
    let child = {};
    if (Math.random() < 0.25) {
        child = this.select();
    } else {
        let p1 = this.select();
        let p2 = this.select();
        if (p1.fitness < p2.fitness) {
            child = crossover(p2, p1);
        } else {
            child = crossover(p1, p2);
        }
    }
    mutate(child);
    return child;
}

Specie.prototype.select = function() {
    let fitsum = this.genomes.map(x => x.fitness).reduce((a, c) => a + c);
    let threshold = Math.random() * fitsum;
    let sum = 0;
    for(let i in this.genomes) {
        sum += this.genomes[i].fitness;
        if(sum >= threshold) {
            return this.genomes[i];
        }
    }
    console.log("j "+fitsum+" "+threshold);
    return this.genomes[0];
}

module.exports.Specie = Specie;
module.exports.createNextGeneration = createNextGeneration;
