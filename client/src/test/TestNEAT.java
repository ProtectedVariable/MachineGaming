package test;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

import me.pv.mg.client.nn.ActivationFunctions;
import me.pv.mg.client.nn.NEATNetwork;

class TestNEAT {

	@Test
	void testNNXOR() {
		NEATNetwork nn = new NEATNetwork(2, 1, 3, 3, ActivationFunctions::Sng);
	
		nn.addNode(nn.new Node(0, 0)); //A
		nn.addNode(nn.new Node(1, 0)); //B
		nn.addNode(nn.new Node(2, 2)); //O
		nn.addNode(nn.new Node(3, 0)); //BIAS
		
		nn.addNode(nn.new Node(4, 1)); //h1
		nn.addNode(nn.new Node(5, 1)); //h2
		
		nn.addConnection(nn.new Connection(0, 4, 1));
		nn.addConnection(nn.new Connection(0, 5, -1));
		
		nn.addConnection(nn.new Connection(1, 4, -1));
		nn.addConnection(nn.new Connection(1, 5, 1));
		
		nn.addConnection(nn.new Connection(4, 2, 1));
		nn.addConnection(nn.new Connection(5, 2, 1));
		
		nn.connect();
		
		assertEquals(0, nn.propagateForward(new float[] {0, 0})[0]);
		assertEquals(1, nn.propagateForward(new float[] {0, 1})[0]);
		assertEquals(1, nn.propagateForward(new float[] {1, 0})[0]);
		assertEquals(0, nn.propagateForward(new float[] {1, 1})[0]);
	}
	
	@Test
	void testNN2XOR() {
		NEATNetwork nn = new NEATNetwork(2, 2, 10, 3, ActivationFunctions::Sng);
	
		nn.addNode(nn.new Node(0, 0)); //A
		nn.addNode(nn.new Node(1, 0)); //B
		nn.addNode(nn.new Node(2, 2)); //O
		nn.addNode(nn.new Node(3, 2)); //O
		nn.addNode(nn.new Node(10, 0)); //BIAS
		
		nn.addNode(nn.new Node(4, 1)); //h1
		nn.addNode(nn.new Node(5, 1)); //h2
		
		nn.addConnection(nn.new Connection(0, 4, 1));
		nn.addConnection(nn.new Connection(0, 5, -1));
		
		nn.addConnection(nn.new Connection(1, 4, -1));
		nn.addConnection(nn.new Connection(1, 5, 1));
		
		nn.addConnection(nn.new Connection(4, 2, 1));
		nn.addConnection(nn.new Connection(5, 2, 1));
		
		nn.addConnection(nn.new Connection(4, 3, 1));
		nn.addConnection(nn.new Connection(5, 3, 1));
		
		nn.connect();
		
		assertEquals(0, nn.propagateForward(new float[] {0, 0})[0]);
		assertEquals(1, nn.propagateForward(new float[] {0, 1})[0]);
		assertEquals(1, nn.propagateForward(new float[] {1, 0})[0]);
		assertEquals(0, nn.propagateForward(new float[] {1, 1})[0]);
		
		assertEquals(0, nn.propagateForward(new float[] {0, 0})[1]);
		assertEquals(1, nn.propagateForward(new float[] {0, 1})[1]);
		assertEquals(1, nn.propagateForward(new float[] {1, 0})[1]);
		assertEquals(0, nn.propagateForward(new float[] {1, 1})[1]);
	}

}
