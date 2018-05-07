package me.pv.mg.client.simulation;

import java.awt.Graphics2D;

import me.pv.mg.client.nn.NeuralNetwork;

public interface Simulator {
	float simulate(NeuralNetwork nn, String fitness, boolean display);
	void paint(Graphics2D g);
}
