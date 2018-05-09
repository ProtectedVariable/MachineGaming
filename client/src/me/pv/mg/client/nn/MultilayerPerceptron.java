package me.pv.mg.client.nn;

import java.awt.Graphics;

public class MultilayerPerceptron extends NeuralNetwork {
	
	private float[] inToHid;
	private float[][] hidden;
 	private float[] hidToOut;
 	
 	private float[][] hidValue;
 	
	
	public MultilayerPerceptron(int inputCount, int hLayerCount, int[] hLayers, int outputCount, ActivationFunction activationFunction) {
		super(inputCount, outputCount, activationFunction);
		this.inToHid = new float[(inputCount + 1) * hLayers[0]];
		this.hidden = new float[hLayerCount - 1][];
		for (int i = 1; i < hLayers.length; i++) {
			this.hidden[i - 1] = new float[hLayers[i - 1] * hLayers[i]];
		}
		this.hidToOut = new float[hLayers[hLayerCount-1] * outputCount];
		
		this.hidValue = new float[hLayerCount][];
		for (int i = 0; i < hLayers.length; i++) {
			this.hidValue[i] = new float[hLayers[i]];
		}
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
	public float[] propagateForward(float[] finput) {
		float[] input = new float[finput.length + 1];
		for (int i = 0; i < finput.length; i++) {
			input[i] = finput[i];
		}
		input[input.length - 1] = 1;
		
		for (int i = 0; i < this.hidValue.length; i++) {
			for (int j = 0; j < this.hidValue[i].length; j++) {
				float sum = 0;
				int lim = (i == 0 ? input.length : this.hidValue[i - 1].length);
				for (int k = 0; k < lim; k++) {
					if(i == 0) {
						sum += input[k] * inToHid[k + j * lim];
					} else {
						sum += this.hidValue[i-1][k] * hidden[i-1][k + j * lim];
					}
				}
				hidValue[i][j] = this.activationFunction.activate(sum);
			}
		}
		
		float[] output = new float[outputCount];
		for (int i = 0; i < outputCount; i++) {
			float sum = 0;
			for (int j = 0; j < hidValue[hidValue.length - 1].length; j++) {
				//take the furtest layer and forward to output
				sum += hidValue[hidValue.length - 1][j] * hidToOut[j + i * hidValue[hidValue.length - 1].length];
			}
			output[i] = this.activationFunction.activate(sum);
		}
		return output;
	}

	@Override
	public void display(Graphics g) {
		
	}
	
	
}
