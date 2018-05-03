package me.pv.mg.client.genetic;

import me.pv.mg.client.nn.MultilayerPerceptron;
import me.pv.mg.client.nn.NeuralNetwork;
import me.pv.mg.protobuf.Mg.MGNetworkType;

public class GenomeCodec {

	public NeuralNetwork toNeuralNetwork(String genome, String metadata, MGNetworkType type) {
			if(type == MGNetworkType.MG_MULTILAYER_PERCEPTRON) {
				//MultilayerPerceptron mlp = new MultilayerPerceptron(inputCount, hLayerCount, hLayers, outputCount, activationFunction)
			}
			return null;
	}
	
}
