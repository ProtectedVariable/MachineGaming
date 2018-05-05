package me.pv.mg.client.simulation;

import me.pv.mg.client.nn.NeuralNetwork;

public interface Simulator {
	float simulate(NeuralNetwork nn, String fitness, boolean display);
}
