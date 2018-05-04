package me.pv.mg.client.simulation;

import me.pv.mg.client.nn.NeuralNetwork;

public interface Simulator {
	void simulate(NeuralNetwork nn, boolean display);
}
