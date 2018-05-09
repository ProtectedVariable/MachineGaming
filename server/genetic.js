"use strict";
let GenomeType = {
    MULTILAYER_PERCEPTRON: 0,
    NEAT: 1
};

let NetworkMetadata = {
    0: { //ASTEROID_MULTILAYER_PERCEPTRON
        inputCount: 8,
        hLayerCount: 1,
        hLayers: [12],
        outputCount: 4
    }
};

function metadataString(meta) {
    return meta.inputCount+","+meta.hLayerCount+","+meta.hLayers+","+meta.outputCount;
}

function createRandomGeneration(genomeType, population, netMetadata) {
    let genomes = [];

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
    return genomes;
}

function createNextGeneration(genomes, genomeType, mutationRate, population) {
    const startProba = 0.90;
    let nextgen = [];
    let childs = 1;
    genomes.sort(function(a, b) { //Sort greater fitness first
        if(a.fitness < b.fitness) {
            return 1;
        } else if(a.fitness > b.fitness) {
            return -1;
        }
        return 0;
    });
    nextgen.push({code: genomes[0].code, computing: false, fitness: -1});
    while(childs != population) {
        for (let i in genomes) {
            if(Math.random() < (startProba - (i / population))) {
                //First parent
                for (let j in genomes) {
                    if(Math.random() < (startProba - (j / population))) {
                        //Second parent
                        let childGenome = {code: crossover(genomes[i], genomes[j]), computing: false, fitness: -1};
                        mutate(childGenome, mutationRate);
                        nextgen.push(childGenome);
                        childs++;
                        break;
                    }
                }
            }
            if(childs == population) {
                break;
            }
        }
    }
    return nextgen;
}

function crossover(g1, g2) {
    let g1Array = g1.code.split(",");
    let g2Array = g2.code.split(",");
    let crosspoint = Math.ceil(Math.random() * (g1Array.length - 1));
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
        if(mutationGene != undefined && mutationGene != "") {
            let newValue = parseFloat(mutationGene) + (Math.random() * 4 - 2);
            gArray[i] = ""+newValue;
            g.code = "";
            for (let j = 0; j < gArray.length; j++) {
                g.code += gArray[i] + (j == gArray.length - 1 ? "": ",");
            }
        }
    }
}

module.exports.GenomeType = GenomeType;
module.exports.NetworkMetadata = NetworkMetadata;
module.exports.createRandomGeneration = createRandomGeneration;
module.exports.createNextGeneration = createNextGeneration;
module.exports.metadataString = metadataString;
