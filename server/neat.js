"use strict";
const genetic = require("./genetic.js")

let species = [];

function createNextGeneration(genomes) {
    let nextgen = [];
    speciate();
    cullSpecies();
    killStaleSpecies();
    killBadSpecies(genomes.length);

    let averageSum = getAvgFitnessSum();
    for (let i in species) {
        species[i].genomes[0].fitness = -1;
        species[i].genomes[0].computing = false;
        nextgen.push(species[i].genomes[0]);
        let childAlloc = Math.floor(species[i].averageFitness / averageSum * genomes.length) - 1;
        for (let i = 0; i < childAlloc; i++) {
            nextgen.push(s.giveMeBaby(innovationHistory));
        }
    }
    for(let i = nextgen.length; i < population; i++) {
        nextgen.push(species[0].giveMeBaby(innovationHistory));
    }
    return nextgen;
}

function speciate(genomes) {
    for(let i in species) {
        species[i].clear();
    }
    for(let i in genomes) {
        let speciesFound = false;
        for(let s in species) {
            if(s.sameSpecies(genomes[i])) {
                s.addToSpecies(genomes[i]);
                speciesFound = true;
                break;
            }
        }
        if(!speciesFound) {
            species.push(new Specie(genomes[i]));
        }
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
    for (let i in species) {
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

    for(let i in species) {
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
        inputs: g1.inputCount,
        outputs: g1.outputCount,
        layers: g1.layers,
        nextNode: g1.nextNode,
        biasNode: g1.biasNode,
        computing: false,
        fitness: -1
    };

    let childGenes = [];
    let enabledGenes = [];

    for(let i = 0; i < g1.genes.length; i++) {
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
                childGenes.push(g2.genes[i]);
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
        child.genes.push({from: childGenes[i].from, to: childGenes[i].to, weight: childGenes[i].weight, innovationNo: childGenes[i].innovationNo});
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

function mutate(g, innovationHistory) {
    if (Math.random() < 0.8) {
        for(let i in g.genes) {
            g.genes[i].weight = mutateWeight(g.genes[i].weight);
        }
    }

    if (Math.random() < 0.05) {
        addConnection(innovationHistory);
    }

    if (Math.random() < 0.03) {
        addNode(innovationHistory);
    }
}

function mutateWeight(w) {
    if (Math.random() < 0.1) {
        return Math.random() * 2 - 1;
    } else {
        return w + ((Math.random() - 0.5) / 30);
    }
}

const excessCoeff = 1.5;
const weightDiffCoeff = 0.8;
const compatibilityThreshold = 1;

function Specie(genome) {
    this.genomes = [genome];
    this.bestFitness = genome.fitness;
    this.best = genome;
    this.staleness = -1;
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
    return (g1.genes.length + g2.genes.length - 2 * (matching));
}

Specie.prototype.averageWeightDiff = function(g1, g2) {
    let matching = 0;
    let totalDiff = 0;
    for(let i in g1.genes) {
        for(let j in g2.genes) {
            if(g1.genes[i].innovationNo == g2.genes[j].innovationNo) {
                matching++;
                totalDiff += abs(g1.genes[i].weight - g2.genes[j].weight);
                break;
            }
        }
    }
    return matching == 0 ? 100 : totalDiff / matching;
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
    this.averageFitness = this.genomes.map(x => x.fitness).reduce((a, c) => a + c) / this.genomes.length;
}

Specie.prototype.cull = function() {
    if(this.genomes.length > 2) {
        for(let i = this.genomes.length / 2; i < this.genomes.length; i++) {
            this.genomes.splice(i, 1);
            i--;
        }
    }
}

Specie.prototype.fitnessSharing = function() {
    for (let i in this.genomes) {
        this.genomes[i].fitness /= this.genomes.length;
    }
}

Specie.prototype.clear = function() {
    this.genomes = [];
    this.bestFitness = 0;
}

Specie.prototype.yieldChild = function(innovationHistory) {
    if (Math.random() < 0.25) {
        let g = this.select();
        g.computing = false;
        g.fitness = -1;
        return g;
    } else {
        let p1 = select();
        let p2 = select();

        let child = {};
        if (p1.fitness < p2.fitness) {
            child = crossover(p2, p1);
        } else {
            child = crossover(p1, p2);
        }
    }
    mutate(child, innovationHistory);
    return child;
}

Specie.prototype.select = function() {
    let fitsum = this.genomes.map(x => x.fitness).reduce((a,c) => a + c);
    let threshold = Math.random() * fitsum;
    let sum = 0;
    for(let i in this.genomes) {
        sum += this.genomes[i].fitness;
        if(sum >= threshold) {
            return this.genomes[i];
        }
    }
    return this.genomes[0];
}

module.exports.Specie = Specie;
module.exports.createNextGeneration = createNextGeneration;
