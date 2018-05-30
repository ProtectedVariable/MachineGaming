package test;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import me.pv.mg.client.nn.ActivationFunctions;
import me.pv.mg.client.nn.MultilayerPerceptron;
import me.pv.mg.client.nn.NEATNetwork;

class TestNEAT {

	@Test
	void testNNXOR() {
		NEATNetwork nn = new NEATNetwork(2, 1, 2, 3, ActivationFunctions::Sng);
	
		nn.addNode(nn.new Node(0, 0)); //A
		nn.addNode(nn.new Node(1, 0)); //B
		nn.addNode(nn.new Node(2, 0)); //BIAS
		
		

		
		assertEquals(0, nn.propagateForward(new float[] {1, 1})[0]);
		assertEquals(1, nn.propagateForward(new float[] {0, 1})[0]);
		assertEquals(1, nn.propagateForward(new float[] {1, 0})[0]);
		assertEquals(0, nn.propagateForward(new float[] {0, 0})[0]);
	}

}
