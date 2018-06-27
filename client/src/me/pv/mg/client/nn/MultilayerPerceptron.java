package me.pv.mg.client.nn;

import java.awt.Color;
import java.awt.Graphics;

public class MultilayerPerceptron extends NeuralNetwork {
	
	private float[] inToHid;
	private float[][] hidden;
 	private float[] hidToOut;
 	
 	private float[][] hidValue;
 	
 	private int[] hLayers;
 	
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
		this.hLayers = hLayers;
	}

	/**
	 * Sets all the weight of the network
	 * @param weights	Array of the new weights
	 */
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
	public void display(Graphics g, int x, int y, int w, int h) {
		for(int i = 0; i <= hLayers.length + 1; i++) {
			if(i == 0) {
				for(int j = 0; j < inputCount + 1; j++) {
					int x1 = x + 5;
					int y1 = y + (j * h / (inputCount + 1));
					for(int k = 0; k < hLayers[0]; k++) {
						int x2 = x + 5 + (w / (hLayers.length + 2));
						int y2 = y + (k * h / hLayers[0]);
						if(inToHid[j + k * inputCount] > 0) {
							g.setColor(Color.GREEN);
						} else {
							g.setColor(Color.RED);
						}
						g.drawLine(x1 + 5, y1 + 5, x2 + 5, y2 + 5);
					}
					g.setColor(Color.BLACK);
					g.fillOval(x1, y1, 10, 10);
				}
			} else if(i == hLayers.length + 1) {
				for(int j = 0; j < outputCount; j++) {
        				int x1 = x + 5 + (i * w / (hLayers.length + 2));
        				int y1 = y + (j * h / outputCount);
        				g.setColor(Color.BLACK);
        				g.fillOval(x1, y1, 10, 10);
				}
			} else {
				for(int j = 0; j < hLayers[i - 1]; j++) {
					int x1 = x + 5 + (i * w / (hLayers.length + 2));
					int y1 = y + (j * h / hLayers[i - 1]);
					int lim = (i < hLayers.length ? hLayers[i] : outputCount);
					for(int k = 0; k < lim; k++) {
						int x2 = x + 5 + ((i + 1) * w / (hLayers.length + 2));
						int y2 = y + (k * h /  lim);
						if((i < hLayers.length ? hidden[i - 1][j + k * lim] : hidToOut[j + k * lim]) > 0) {
							g.setColor(Color.GREEN);
						} else {
							g.setColor(Color.RED);
						}
						g.drawLine(x1 + 5, y1 + 5, x2 + 5, y2 + 5);
					}
					g.setColor(Color.BLACK);
					g.fillOval(x1, y1, 10, 10);
				}
			}
		}
	}
}
