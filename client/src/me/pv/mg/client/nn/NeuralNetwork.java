package me.pv.mg.client.nn;

import java.awt.Graphics;

public abstract class NeuralNetwork {

	protected int inputCount, outputCount;
	protected ActivationFunction activationFunction;
	
	public NeuralNetwork(int inputCount, int outputCount, ActivationFunction activationFunction) {
		this.inputCount = inputCount;
		this.outputCount = outputCount;
		this.activationFunction = activationFunction;
	}
	
	/**
	 * Propagates the input through the neural network all the way until the outputs are set
	 * @param input		The input signals to propagates
	 * @return			The output result
	 */
	public abstract float[] propagateForward(float[] input);
	
	/**
	 * Displays the neural network on the specified rectangle
	 * @param g			The graphics to access the frame
	 * @param x			The rectangle's top left corner x coordinate
	 * @param y			The rectangle's top left corner y coordinate
	 * @param w			The width of the rectangle
	 * @param h			The height of the rectangle
	 */
	public abstract void display(Graphics g, int x, int y, int w, int h);
	
}
