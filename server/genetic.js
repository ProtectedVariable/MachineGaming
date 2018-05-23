"use strict";
const proto = require('./protobuf/mg_pb.js');
const excessCoeff = 1.5;
const weightDiffCoeff = 0.8;
const compatibilityThreshold = 1;

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
    nextgen.push({code: genomes[0].code, computing: false, fitness: -1});
    for(let i = 1; i < population; i++) {
        let g = null;
        if(i < population / 2) {
            g = {code: select(genomes), computing: false, fitness: -1};
        } else {
            g = {code: crossover(select(genomes), select(genomes)), computing: false, fitness: -1};
        }
        mutate(g, mutationRate);
        nextgen.push(g);
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
            return population[i].code;
        }
    }
    return population[0].code;
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
    let species = [];
    for(let i in genomes) {
        let speciesFound = false;
        for(let s in species) {
            if(s.sameSpecies(pop.get(i).brain)) {
                s.addToSpecies(pop.get(i));//add it to the species
                speciesFound = true;
                break;
            }
        }
        if(!speciesFound) {
            let gs = [];
            gs.push(genomes[i]);
            species.push({genomes: gs, bestFitness: genomes[i].fitness, best: genomes[i]});
        }
    }
}

module.exports.createRandomGeneration = createRandomGeneration;
module.exports.metadataFromTopology = metadataFromTopology;
module.exports.createNextGeneration = createNextGeneration;
