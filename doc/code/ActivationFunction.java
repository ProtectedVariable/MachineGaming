/**
 * This files contains the interface for activation functions
 * 
 * @author Thomas Ibanez
 */
package me.pv.mg.client.nn;

public interface ActivationFunction {

	/**
	 * Gets the activation result of the function
	 * @param in		input to feed the function with
	 * @return		The output of the function
	 */
	float activate(float in);
	
}
