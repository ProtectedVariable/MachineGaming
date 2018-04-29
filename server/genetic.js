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
    return ""+meta.inputCount+","+meta.hLayerCount+","+meta.hLayers+","+meta.outputCount;
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

}

module.exports.GenomeType = GenomeType;
module.exports.NetworkMetadata = NetworkMetadata;
module.exports.createRandomGeneration = createRandomGeneration;
module.exports.createNextGeneration = createNextGeneration;
module.exports.metadataString = metadataString;
