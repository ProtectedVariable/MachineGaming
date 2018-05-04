package test;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import me.pv.mg.client.nn.ActivationFunctions;
import me.pv.mg.client.nn.MultilayerPerceptron;

class TestMLP {

	@Test
	void testMLPXOR() {
		MultilayerPerceptron mlp = new MultilayerPerceptron(2, 1, new int[] {2}, 1, ActivationFunctions::Sng);
		mlp.setAllWeight(new float[] {
				1, -1, 0,
				-1, 1, 0,
				1, 1
		});
		assertEquals(0, mlp.propagateForward(new float[] {1, 1})[0]);
		assertEquals(1, mlp.propagateForward(new float[] {0, 1})[0]);
		assertEquals(1, mlp.propagateForward(new float[] {1, 0})[0]);
		assertEquals(0, mlp.propagateForward(new float[] {0, 0})[0]);
	}

}
