package me.pv.mg.client;

import me.pv.mg.client.genetic.GenomeCodec;
import me.pv.mg.client.network.Network;
import me.pv.mg.client.nn.NeuralNetwork;
import me.pv.mg.client.simulation.AsteroidSimulator;
import me.pv.mg.client.simulation.Simulator;
import me.pv.mg.protobuf.Mg.MGNetworkType;

public class Client extends Thread {

	private Network network;
	private GenomeCodec gc;
	private NeuralNetwork nn;
	private Simulator sim;
	
	private String name;
	
	public Client(String serverIP, String name) {
		this.network = new Network(serverIP, this);
		this.gc = new GenomeCodec();
		this.name = name;
	}
	
	@Override
	public void run() {
		this.network.joinPool(name);
		while(true) {
			this.network.waitNextMessage();
		}
	}
	
	public void startSimulation(String game, String fitness, String genome, String metadata, MGNetworkType type) {
		this.nn = this.gc.toNeuralNetwork(genome, metadata, type);
		if(game.equals("Asteroid")) {
			this.sim = new AsteroidSimulator();
		}
	}
	
	public static void main(String[] args) {
		if(args.length < 3) {
			System.out.println("Usage: client.jar <server_ip> <#threads> <name>");
			System.exit(1);
		}
		int threads = Integer.parseInt(args[1]);
		Client[] clients = new Client[threads];
		for (int i = 0; i < threads; i++) {
			Client c = new Client(args[0], args[2]);
			clients[i] = c;
			c.start();
		}
		
		for (int i = 0; i < clients.length; i++) {
			try {
				clients[i].join();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}
}
