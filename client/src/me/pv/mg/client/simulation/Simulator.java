/**
 * This files contains the simulator interface
 * 
 * @author Thomas Ibanez
 */
package me.pv.mg.client.simulation;

import java.awt.Graphics2D;

import me.pv.mg.client.nn.NeuralNetwork;

public interface Simulator {
	
	/**
	 * Simulates the whole game and computes the fitness
	 * @param nn			Neural network to simuate with
	 * @param display	True if the game should be displayed, false otherwise
	 * @return			Fitness of the network
	 */
	float simulate(NeuralNetwork nn, boolean display);
	
	/**
	 * Draws the simulation
	 * @param g		Graphics to draw with
	 */
	void paint(Graphics2D g);
}
