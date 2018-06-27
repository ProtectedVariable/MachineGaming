package me.pv.mg.client.genetic;

import me.pv.mg.client.nn.ActivationFunctions;
import me.pv.mg.client.nn.MultilayerPerceptron;
import me.pv.mg.client.nn.NEATNetwork;
import me.pv.mg.client.nn.NeuralNetwork;
import me.pv.mg.protobuf.Mg.MGNetworkType;

public class GenomeCodec {

	/**
	 * Converts a genome string to a netural network object
	 * @param genome		Genome string
	 * @param metadata	Metadata of the network
	 * @param type		Type of the network
	 * @return			Neural network corresponding to the genome
	 */
	public NeuralNetwork toNeuralNetwork(String genome, String metadata, MGNetworkType type) {
		String[] meta = metadata.split(",");
		int inputCount = Integer.parseInt(meta[0]);
		int hLayerCount = Integer.parseInt(meta[1]);
		int[] hLayers = new int[hLayerCount];
		for (int i = 0; i < hLayers.length; i++) {
			hLayers[i] = Integer.parseInt(meta[2 + i]);
		}
		int outputCount = Integer.parseInt(meta[2 + Math.max(1, hLayerCount)]);

		if (type == MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
			String[] genomeInf = genome.split(",");
			float[] weights = new float[genomeInf.length];
			for (int i = 0; i < weights.length; i++) {
				weights[i] = Float.parseFloat(genomeInf[i]);
			}
			MultilayerPerceptron mlp = new MultilayerPerceptron(inputCount, hLayerCount, hLayers, outputCount, ActivationFunctions::Sigmoid);
			mlp.setAllWeight(weights);
			return mlp;
		} else if (type == MGNetworkType.MG_NEAT) {
			String[] infos = genome.split(",");
			int genesCount = Integer.parseInt(infos[0]);
			int nodeCount = Integer.parseInt(infos[1]);
			int bias = Integer.parseInt(infos[2]);
			int layers = Integer.parseInt(infos[3]);
			
			NEATNetwork nn = new NEATNetwork(inputCount, outputCount, bias, layers, ActivationFunctions::Sigmoid);

			for (int i = 4 + 3 * genesCount; i < 4 + 3 * genesCount + 2 * nodeCount; i += 2) {
				int no = Integer.parseInt(infos[i]);
				int layer = Integer.parseInt(infos[i + 1]);
				nn.addNode(nn.new Node(no, layer));
			}
			
			for (int i = 4; i < 4 + 3 * genesCount; i += 3) {
				int from = Integer.parseInt(infos[i]);
				int to = Integer.parseInt(infos[i + 1]);
				float w = Float.parseFloat(infos[i + 2]);
				nn.addConnection(nn.new Connection(from, to, w));
			}
			nn.connect();
			return nn;
		}
		return null;
	}

}
