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
	
	public abstract float[] propagateForward(float[] input);
	public abstract void display(Graphics g);
	
}
