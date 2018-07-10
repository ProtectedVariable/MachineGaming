/**
 * This files contains the program's entry point
 * 
 * @author Thomas Ibanez
 */
package me.pv.mg.client;

import me.pv.mg.client.genetic.GenomeCodec;
import me.pv.mg.client.network.Network;
import me.pv.mg.client.nn.NeuralNetwork;
import me.pv.mg.client.simulation.AsteroidSimulator;
import me.pv.mg.client.simulation.Simulator;
import me.pv.mg.protobuf.Mg.MGNetworkType;

/**
 * Program's main class, the class will be instantiated one time per thread
 */
public class Client extends Thread {

	private Network network;
	private GenomeCodec gc;
	private NeuralNetwork nn;
	private Simulator sim;
	
	private String name;
	private boolean display;
	
	public Client(String serverIP, String name, boolean display) {
		this.network = new Network(serverIP, this);
		this.gc = new GenomeCodec();
		this.name = name;
		this.display = display;
	}
	
	@Override
	public void run() {
		this.network.joinPool(name, display);
		while(true) {
			this.network.waitNextMessage();
		}
	}
	
	/**
	 * Starts to compute a simulation of the given network on the given game
	 * @param game		Name of the game
	 * @param genome		String representation of the genome
	 * @param metadata	Metadata of the genome
	 * @param type		Type of network to build
	 */
	public void startSimulation(String game, String genome, String metadata, MGNetworkType type) {
		this.nn = this.gc.toNeuralNetwork(genome, metadata, type);
		if(game.equals("Asteroid")) {
			if(!display) {
				this.network.sendResponse(true);
			}
			this.sim = new AsteroidSimulator();
			long startTime = System.currentTimeMillis();
			float simFitness = this.sim.simulate(this.nn, display);
			if(!display) {
				this.network.sendResult(simFitness, (int) (System.currentTimeMillis() - startTime));
			}
		} else {
			this.network.sendResponse(false);
		}
	}
	
	public static void main(String[] args) {
		if(args.length < 3) {
			System.out.println("Usage: client.jar <server_ip> <#threads> <name> [-s]");
			System.exit(1);
		}
		boolean spec = false;
		if(args.length > 3) {
			if(args[3].equals("-s")) {
				spec = true;
			}
		}
		int threads = spec ? 1 : Integer.parseInt(args[1]);
		Client[] clients = new Client[threads];
		for (int i = 0; i < threads; i++) {
			Client c = new Client(args[0], args[2], spec);
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
