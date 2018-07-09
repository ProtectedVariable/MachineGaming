/**
 * Creates a random population
 * @param  {MGNetworkType} genomeType  The type of the genomes to create
 * @param  {Number} population  The amount of genome to create
 * @param  {Object} netMetadata The metadata of the genomes to create
 * @return {Array}             Array containing the random genomes
 */
function createRandomGeneration(genomeType, population, netMetadata) {...}

/**
 * Gives the metadata string to send to the client for a network topology
 * @param  {Object} topo The topology of the network
 * @return {String}      String representation of the topology
 */
function metadataFromTopology(topo) {...}

/**
 * Encodes the genome to a string
 * @param  {Object} genome The genome to encode
 * @param  {MGNetworkType} type   Enum value of the type of the genome
 * @return {String}        String representation of the genome
 */
function genomeString(genome, type) {...}

/**
 * Creates the next generation of genomes, using the previous generation which has been evaluated
 * @param  {Array} genomes    The previous generation
 * @param  {MGNetworkType} genomeType The type of the genomes
 * @return {Array}            The next generation, using the right genetic algorithm
 */
function createNextGeneration(genomes, genomeType) {...}
