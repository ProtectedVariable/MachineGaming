package me.pv.mg.client.nn;

public class ActivationFunctions {

	public static float Sigmoid(float in) {
		return (float) (1.0 / (1.0 + Math.exp(-1 * in)));
	}
	
	public static float Sng(float in) {
		return in <= 0 ? 0 : 1;
	}
	
	public static float Tanh(float in) {
		return (float) Math.tanh(in);
	}
	
}
