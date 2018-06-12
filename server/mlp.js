/**
 * This module handles all the MLP Genetic Algorithm
 *
 * @author Thomas Ibanez
 * @version 1.0
 */
"use strict";
const genetic = require("./genetic.js");
const MUTATION_RATE = 0.1;

/**
 * Creates a new generation of genomes from the previous one
 * @param  {Array} genomes genomes of the previous generation
 * @return {Array}         new generations of genomes
 */
function createNextGeneration(genomes) {
    let nextgen = [];
    nextgen.push({code: genomes[0].code, computing: false, fitness: -1});
    for(let i = 1; i < genomes.length; i++) {
        let g = null;
        if(i < genomes.length / 2) {
            g = {code: genetic.select(genomes).code, computing: false, fitness: -1};
        } else {
            g = {code: crossover(genetic.select(genomes).code, genetic.select(genomes).code), computing: false, fitness: -1};
        }
        mutate(g, MUTATION_RATE);
        nextgen.push(g);
    }
    return nextgen;
}

/**
 * Makes an offspring from 2 parents by crossing over genes
 * @param  {Genome} g1 Parent 1
 * @param  {Genome} g2 Parent 2
 * @return {Genome}    Offspring
 */
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

/**
 * Mutates slightly the weight of a genome
 * @param  {Genome} g  genome to mutate
 * @param  {Number} mr probability of a mutation occuring
 */
function mutate(g, mr) {
    if(Math.random() < mr) {
        let gArray = g.code.split(",");
        let i = Math.ceil(Math.random() * (gArray.length - 1));
        let mutationGene = gArray[i];
        let newValue = parseFloat(mutationGene) + (Math.random() * 2 - 1);
        if(newValue > 1) {
            newValue = 1;
        } else if(newValue < -1) {
            newValue = -1;
        }
        gArray[i] = ""+newValue;
        g.code = "";
        for(let j = 0; j < gArray.length; j++) {
            g.code += gArray[j] + (j == gArray.length - 1 ? "": ",");
        }
    }
}


module.exports.createNextGeneration = createNextGeneration;
