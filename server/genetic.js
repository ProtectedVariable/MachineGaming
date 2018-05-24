"use strict";
const proto = require('./protobuf/mg_pb.js');
const specie = require('./specie.js');

let species = [];

function metadataFromTopology(topo) {
    return topo.inputCount+","+topo.hLayerCount+","+topo.hLayers+","+topo.outputCount;
}

function createRandomGeneration(genomeType, population, netMetadata) {
    let genomes = [];

    if(genomeType == proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
        let linkCount = (netMetadata.inputCount + 1) * netMetadata.hLayers[0];
        for (let k = 1; k < netMetadata.hLayerCount; k++) {
            linkCount += netMetadata.hLayers[k] * netMetadata.hLayers[k-1];
        }
        linkCount += netMetadata.hLayers[netMetadata.hLayerCount - 1] * netMetadata.outputCount;

        for(let i = 0; i < population; i++) {
            let genomeCode = "";
            for(let j = 0; j < linkCount; j++) {
                genomeCode += (Math.random() * 4 - 2) + (j == linkCount - 1 ? "": ",");
            }
            genomes.push({code: genomeCode, computing: false, fitness: -1});
        }
    } else {
        for(let i = 0; i < population; i++) {
            let g = {
                genes: [],
                nodes: [],
                inputs: netMetadata.inputCount,
                outputs: netMetadata.outputCount,
                layers: 2,
                nextNode: 0,
                biasNode: 0,
                computing: false,
                fitness: -1
            }
            //Inputs
            for (let i = 0; i < g.inputs; i++) {
                g.nextNode++;
                g.nodes.push({no: i, layer: 0});
            }
            //Outputs
            for (let i = 0; i < g.outputs; i++) {
                g.nextNode++;
                g.nodes.push({no: i + g.inputs, layer: 1});
            }
            //Bias
            g.nodes.push({no: g.nextNode, layer: 0});
            g.biasNode = g.nextNode;
            g.nextNode++;

            //Connect inputs to outputs
            let next = 0;
            for (let i = 0; i < g.inputs; i++) {
                for (let j = 0; j < g.outputs; j++) {
                    g.genes.push({from: i, to: g.inputs + j, weight: Math.random() * 2 - 1, innovationNo: next});
                    next++;
                }
            }

            //Connect bias to outputs
            for (let i = 0; i < g.outputs; i++) {
                g.genes.push({from: g.biasNode, to: g.inputs + i, weight: Math.random() * 2 - 1, innovationNo: next});
                next++;
            }
            genomes.push(g);
        }
    }
    return genomes;
}

function createNextGeneration(genomes, genomeType, mutationRate, population) {
    let nextgen = [];
    genomes.sort(function(a, b) { //Sort greater fitness first
        if(a.fitness < b.fitness) {
            return 1;
        } else if(a.fitness > b.fitness) {
            return -1;
        }
        return 0;
    });
    if(genomeType == proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
        nextgen.push({code: genomes[0].code, computing: false, fitness: -1});
        for(let i = 1; i < population; i++) {
            let g = null;
            if(i < population / 2) {
                g = {code: select(genomes).code, computing: false, fitness: -1};
            } else {
                g = {code: crossover(select(genomes).code, select(genomes).code), computing: false, fitness: -1};
            }
            mutate(g, mutationRate);
            nextgen.push(g);
        }
    } else {
        speciate();
        cullSpecies();
        killStaleSpecies();
        killBadSpecies(population);

        let averageSum = getAvgFitnessSum();
        for (let i in species) {
            species[i].genomes[0].fitness = -1;
            species[i].genomes[0].computing = false;
            nextgen.push(species[i].genomes[0]);
            let childAlloc = Math.floor(species[i].averageFitness / averageSum * population) - 1;
            for (let i = 0; i < childAlloc; i++) {
                nextgen.push(s.giveMeBaby(innovationHistory));
            }
        }
        //TODO FAIRE UN MODULE NEAT DANS LEQUEL JE MET TOUTE CA!!¨
        //TODO DEW IT
        for(let i = nextgen.length; i < population; i++) {
            nextgen.add(species[0].giveMeBaby(innovationHistory));
        }
    }
    return nextgen;
}

function select(population) {
    let fitsum = population.map(x => x.fitness).reduce((a,c) => a + c);
    let threshold = Math.random() * fitsum;
    let sum = 0;
    for(let i in population) {
        sum += population[i].fitness;
        if(sum >= threshold) {
            return population[i];
        }
    }
    return population[0];
}

function crossover(g1, g2) {
    let g1Array = g1.split(",");
    let g2Array = g2.split(",");
    let crosspoint = Math.round(Math.random() * (g1Array.length - 1));
    let newCode = "";
    for(let i = 0; i < g1Array.length; i++) {
        let g = "";
        if(i <= crosspoint) {
            g = g1Array[i];
        } else {
            g = g2Array[i];
        }
        newCode += g + (i == g1Array.length - 1 ? "": ",");
    }
    return newCode;
}

function mutate(g, mr) {
    if(Math.random() < mr) {
        let gArray = g.code.split(",");
        let i = Math.ceil(Math.random() * (gArray.length - 1));
        let mutationGene = gArray[i];
        let newValue = parseFloat(mutationGene) + (Math.random() * 2 - 1);
        gArray[i] = ""+newValue;
        g.code = "";
        for(let j = 0; j < gArray.length; j++) {
            g.code += gArray[j] + (j == gArray.length - 1 ? "": ",");
        }
    }
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
            species.push(new specie.Specie(genomes[i]));
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

module.exports.createRandomGeneration = createRandomGeneration;
module.exports.metadataFromTopology = metadataFromTopology;
module.exports.createNextGeneration = createNextGeneration;
