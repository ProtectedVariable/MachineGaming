public interface ActivationFunction {

	/**
	 * Gets the activation result of the function
	 * @param in		input to feed the function with
	 * @return		The output of the function
	 */
	float activate(float in);

}

public final class ActivationFunctions {

	public static float Sigmoid(float in) {
		return (float) (1.0 / (1.0 + Math.exp(-3 * in)));
	}

	public static float Sng(float in) {
		return in <= 0 ? 0 : 1;
	}

	public static float Tanh(float in) {
		return (float) Math.tanh(in);
	}

}
