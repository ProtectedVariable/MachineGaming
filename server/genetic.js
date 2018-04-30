let GenomeType = {
    MULTILAYER_PERCEPTRON: 0,
    NEAT: 1
};

let NetworkMetadata = {
    0: { //ASTEROID_MULTILAYER_PERCEPTRON
        inputCount: 8,
        hLayerCount: 2,
        hLayers: [6, 6],
        outputCount: 5
    }
};

function metadataString(meta) {
    return meta.inputCount+","+meta.hLayerCount+","+meta.hLayers+","+meta.outputCount;
}

function createRandomGeneration(genomeType, population, netMetadata) {
    let genomes = [];

    let linkCount = netMetadata.inputCount * netMetadata.hLayers[0];
    for (let k = 1; k < netMetadata.hLayerCount; k++) {
        linkCount += netMetadata.hLayers[k] * netMetadata.hLayers[k-1];
    }
    linkCount += netMetadata.hLayers[netMetadata.hLayerCount - 1] * netMetadata.outputCount;

    for(let i = 0; i < population; i++) {
        let genomeCode = "";
        for(let j = 0; j < linkCount; j++) {
            genomeCode += (Math.random() * 4 - 2) + ",";
        }
        genomes.push({code: genomeCode, computing: false, fitness: 0});
    }
    return genomes;
}

function createNextGeneration(genomes, genomeType, mutationRate) {
    const startProba = 0.75;
    let nextgen = [];
    let childs = 0;
    genomes.sort(function(a, b) { //Sort greater fitness first
        if(a.fitness < b.fitness) {
            return 1;
        } else if(a.fitness > b.fitness) {
            return -1;
        }
        return 0;
    });

    for (let i in genomes) {
        if(Math.random() < (startProba - (i / 135))) {
            //First parent
            for (let j in genomes) {
                if(Math.random() < (startProba - (j / 135))) {
                    //Second parent
                    let childGenome = {code: crossover(genomes[i], genomes[j]), computing: false, fitness: 0};
                    mutate(childGenome, mutationRate);
                    nextgen.push(childGenome);
                    childs++;
                    break;
                }
            }
        }
        if(childs == 100) {
            break;
        }
    }
    return nextgen;
}

function crossover(g1, g2) {
    let g1Array = g1.code.split(",");
    let g2Array = g2.code.split(",");
    let crosspoint = Math.round(Math.random() * g1Array.length);
    let newCode = "";
    for(let i = 0; i < g1Array.length; i++) {
        if(i <= crosspoint) {
            newCode += g1Array[i]+",";
        } else {
            newCode += g2Array[i]+",";
        }
    }
    return newCode;
}

function mutate(g, mr) {
    if(Math.random() < mr) {
        let gArray = g.code.split(",");
        let i = Math.round(Math.random() * gArray.length);
        let mutationGene = gArray[i];
        let newValue = parseFloat(mutationGene) + (Math.random() * 4 - 2);
        gArray[i] = ""+newValue;
        g.code = "";
        for (let j = 0; i < gArray.length; i++) {
            g.code += gArray[i]+",";
        }
    }
}

module.exports.GenomeType = GenomeType;
module.exports.NetworkMetadata = NetworkMetadata;
module.exports.createRandomGeneration = createRandomGeneration;
module.exports.createNextGeneration = createNextGeneration;
module.exports.metadataString = metadataString;
