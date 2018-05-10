package me.pv.mg.client.genetic;

import me.pv.mg.client.nn.ActivationFunctions;
import me.pv.mg.client.nn.MultilayerPerceptron;
import me.pv.mg.client.nn.NeuralNetwork;
import me.pv.mg.protobuf.Mg.MGNetworkType;

public class GenomeCodec {

	public NeuralNetwork toNeuralNetwork(String genome, String metadata, MGNetworkType type) {
		if (type == MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
			String[] meta = metadata.split(",");
			int inputCount = Integer.parseInt(meta[0]);
			int hLayerCount = Integer.parseInt(meta[1]);
			int[] hLayers = new int[hLayerCount];
			for (int i = 0; i < hLayers.length; i++) {
				hLayers[i] = Integer.parseInt(meta[2 + i]);
			}
			int outputCount = Integer.parseInt(meta[2 + hLayerCount]);
			String[] genomeInf = genome.split(",");
			float[] weights = new float[genomeInf.length];
			for (int i = 0; i < weights.length; i++) {
				weights[i] = Float.parseFloat(genomeInf[i]);
			}
			MultilayerPerceptron mlp = new MultilayerPerceptron(inputCount, hLayerCount, hLayers, outputCount, ActivationFunctions::Sigmoid);
			mlp.setAllWeight(weights);
			return mlp;
		}
		return null;
	}

}
