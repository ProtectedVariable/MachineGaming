package me.pv.mg.client.nn;

import java.awt.Graphics;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

public class NEATNetwork extends NeuralNetwork {

	private List<Connection> genes;
	private Map<Integer, Node> nodes;
	private int bias, layers;
	
	public NEATNetwork(int inputCount, int outputCount, int bias, int layers, ActivationFunction activationFunction) {
		super(inputCount, outputCount, activationFunction);
		this.genes = new ArrayList<>();
		this.nodes = new HashMap<>();
		this.bias = bias;
		this.layers = layers;
	}

	@Override
	public float[] propagateForward(float[] input) {
		for (Entry<Integer, Node> e : nodes.entrySet()) {
			e.getValue().setValue(0);
		}
		
		for(int i = 0; i < input.length; i++) {
			nodes.get(i).setValue(input[i]);
		}
		nodes.get(bias).setValue(1);
		
		for(int i = 0; i < layers; i++) {
			for (Entry<Integer, Node> e : nodes.entrySet()) {
				if(e.getValue().getLayer() == i) {
        				for(Connection c : e.getValue().getOutputs()) {
        					nodes.get(c.getTo()).value += e.getValue().getValue() * c.getWeight();
        				}
				}
			}
		}
		
		float[] outputs = new float[this.outputCount];
		for (int i = 0; i < outputs.length; i++) {
			outputs[i] = nodes.get(i + inputCount).value;
		}
		return outputs;
	}

	@Override
	public void display(Graphics g) {
	}
	
	public void connect() {
		for (Connection connection : genes) {
			this.nodes.get(connection.getFrom()).getOutputs().add(connection);
		}
	}
	
	public void addNode(Node n) {
		this.nodes.put(n.no, n);
	}
	
    public void addConnection(Connection c) {
    		this.genes.add(c);
	}
	
	public class Node {
		private int no, layer;
		private final List<Connection> outputs;
		private float value;
		
		public Node(int no, int layer) {
			this.no = no;
			this.layer = layer;
			this.outputs = new ArrayList<>();
			this.setValue(0);
		}

		public int getNo() {
			return no;
		}

		public void setNo(int no) {
			this.no = no;
		}

		public int getLayer() {
			return layer;
		}

		public void setLayer(int layer) {
			this.layer = layer;
		}

		public List<Connection> getOutputs() {
			return outputs;
		}

		public float getValue() {
			return value;
		}

		public void setValue(float value) {
			this.value = value;
		}
	}
	
	public class Connection {
		
		private int from, to;
		private float weight;
		
		public Connection(int from, int to, float weight) {
			this.from = from;
			this.to = to;
			this.weight = weight;
		}

		public int getFrom() {
			return from;
		}

		public void setFrom(int from) {
			this.from = from;
		}

		public int getTo() {
			return to;
		}

		public void setTo(int to) {
			this.to = to;
		}

		public float getWeight() {
			return weight;
		}

		public void setWeight(float weight) {
			this.weight = weight;
		}
	}

}
