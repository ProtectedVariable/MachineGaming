"use strict";
const proto = require('./protobuf/mg_pb.js');
const NEAT = require('./neat.js');
const MLP = require('./mlp.js');

function metadataFromTopology(topo) {
    return topo.inputCount+","+topo.hLayerCount+","+topo.hLayers+","+topo.outputCount;
}

function genomeString(genome, type) {
    if(type == proto.MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
        return genome.code;
    } else {
        let geneCount = genome.genes.filter(g => g.enabled).length;
        let code = geneCount + "," + genome.nodes.length + "," + genome.biasNode + "," + genome.layers + ",";
        for(let i in genome.genes) {
            if(genome.genes[i].enabled) {
                code += genome.genes[i].from + "," + genome.genes[i].to + "," + genome.genes[i].weight + ",";
            }
        }
        for(let i in genome.nodes) {
            code += genome.nodes[i].no + "," + genome.nodes[i].layer + (i == genome.nodes.length - 1 ? "" : ",");
        }
        return code;
    }
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
                    if(Math.random() < 0.1) {
                        g.genes.push({from: i, to: g.inputs + j, weight: Math.random() * 4 - 2, innovationNo: next, enabled: true});
                        next++;
                    }
                }
            }

            //Connect bias to outputs
            for (let i = 0; i < g.outputs; i++) {
                if(Math.random() < 0.1) {
                    g.genes.push({from: g.biasNode, to: g.inputs + i, weight: Math.random() * 4 - 2, innovationNo: next, enabled: true});
                    next++;
                }
            }
            genomes.push(g);
        }
    }
    return genomes;
}

function createNextGeneration(genomes, genomeType, population) {
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
        nextgen = MLP.createNextGeneration(genomes);
    } else {
        nextgen = NEAT.createNextGeneration(genomes);
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

module.exports.createRandomGeneration = createRandomGeneration;
module.exports.metadataFromTopology = metadataFromTopology;
module.exports.createNextGeneration = createNextGeneration;
module.exports.genomeString = genomeString;
module.exports.select = select;
