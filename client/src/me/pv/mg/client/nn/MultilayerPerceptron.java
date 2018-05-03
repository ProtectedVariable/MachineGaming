package me.pv.mg.client.nn;

public class MultilayerPerceptron extends NeuralNetwork {
	
	private float[] inToHid;
	private float[][] hidden;
 	private float[] hidToOut;
	
	public MultilayerPerceptron(int inputCount, int hLayerCount, int[] hLayers, int outputCount, ActivationFunction activationFunction) {
		super(inputCount, outputCount, activationFunction);
		this.inToHid = new float[(inputCount + 1) * hLayers[0]];
		this.hidden = new float[hLayerCount - 1][];
		for (int i = 1; i < hLayers.length; i++) {
			this.hidden[i - 1] = new float[hLayers[i - 1] * hLayers[i]];
		}
		this.hidToOut = new float[hLayers[hLayerCount-1] * outputCount];
	}

	public void setAllWeight(float[] weights) {
		int offset = 0;
		for(int i = 0; i < this.inToHid.length; i++) {
			this.inToHid[i] = weights[i];
		}
		offset = this.inToHid.length;
		for (int i = 0; i < hidden.length; i++) {
			for (int j = 0; j < hidden[i].length; j++) {
				this.hidden[i][j] = weights[offset];
				offset++;
			}
		}
		for (int i = 0; i < hidToOut.length; i++) {
			this.hidToOut[i] = weights[offset + i];
		}
	}
	
	@Override
	public float[] propagateForward(float[] input) {
		return null;
	}
	
	
}
