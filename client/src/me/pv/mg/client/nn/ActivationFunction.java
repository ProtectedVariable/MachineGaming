package me.pv.mg.client.nn;

public interface ActivationFunction {

	/**
	 * Gets the activation result of the function
	 * @param in		input to feed the function with
	 * @return		The output of the function
	 */
	float activate(float in);
	
}
