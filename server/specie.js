"use strict";
const excessCoeff = 1.5;
const weightDiffCoeff = 0.8;
const compatibilityThreshold = 1;

function Specie(genome) {
    this.genomes = [genome];
    this.bestFitness = genome.fitness;
    this.best = genome;
    this.staleness = 0;
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
        console.log("unexpected");
        this.bestFitness = genome.fitness;
        this.best = genome;
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
       return this.select();
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
    child.mutate(innovationHistory);
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
