package me.pv.mg.client.simulation;

import java.util.ArrayList;
import java.util.List;

import me.pv.mg.client.nn.NeuralNetwork;

public class AsteroidSimulator implements Simulator {

	private List<Asteroid> asteroids;
	
	public AsteroidSimulator() {
		this.asteroids = new ArrayList<>();
	}
	
	@Override
	public float simulate(NeuralNetwork nn, String fitness, boolean display) {
		return 0;
	}
	
	class Asteroid {
		private float x, y;
		private float vx, vy;
		private int size = 3;
		
		public Asteroid[] split() {
			Asteroid[] childs = new Asteroid[2];
			for (int i = 0; i < childs.length; i++) {
				childs[i] = new Asteroid();
				childs[i].x = this.x;
				childs[i].y = this.y;
				childs[i].vx = (float) (this.vx + (Math.random() / 2));
				childs[i].vy = (float) (this.vy + (Math.random() / 2));
				childs[i].size = this.size - 1;
			}
			return childs;
		}
	}
	
	class Ship {
		private float x, y;
		private float angle;
		
	}

}
