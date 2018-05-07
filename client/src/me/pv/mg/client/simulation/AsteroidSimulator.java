package me.pv.mg.client.simulation;

import java.awt.Graphics2D;
import java.awt.Polygon;
import java.util.ArrayList;
import java.util.List;

import me.pv.mg.client.nn.NeuralNetwork;

public class AsteroidSimulator implements Simulator {

	private List<Asteroid> asteroids;
	private Bullet[] bullets;
	private Ship ship;
	public static final int WIDTH = 720;
	public static final int HEIGHT = 720;

	public AsteroidSimulator() {
		this.asteroids = new ArrayList<>();
		this.ship = new Ship();
		this.bullets = new Bullet[5];
	}

	@Override
	public void paint(Graphics2D g) {
		for (Asteroid asteroid : asteroids) {
			int s = asteroid.size * Asteroid.RENDER_MULT;
			g.drawOval((int) (asteroid.x - s / 2f), (int) (asteroid.y - s / 2f), s, s);
		}

		for (Bullet bullet : bullets) {
			if (bullet != null)
				g.drawOval((int) bullet.x, (int) bullet.y, 2, 2);
		}

		g.translate((int) ship.x, (int) ship.y);
		g.rotate(ship.angle);
		g.drawPolygon(ship.poly);
		g.rotate(0);
		g.translate(0, 0);
	}

	@Override
	public float simulate(NeuralNetwork nn, String fitness, boolean display) {
		float tick = 0;
		int ascount = 3;
		int bulletTime = 30;
		Display frame = null;
		if (display) {
			frame = new Display(WIDTH, HEIGHT, this);
			frame.setVisible(true);
		}

		while (ship.isAlive()) {

			if (bulletTime > 0) {
				bulletTime--;
			}
			if (asteroids.size() == 0) {
				ascount++;
				for (int i = 0; i < ascount; i++) {
					asteroids.add(new Asteroid());
				}
			}

			for (int i = 0; i < bullets.length; i++) {
				if (bullets[i] == null && bulletTime == 0) {
					ship.angle += 0.1f;
					bulletTime = 30;
					bullets[i] = new Bullet((int) ship.x, (int) ship.y, ship.angle);
				} else if(bullets[i] != null) {
					bullets[i].x += bullets[i].vx;
					bullets[i].y += bullets[i].vy;
					if (bullets[i].x < 0) {
						bullets[i].x = WIDTH - 1;
					}
					if (bullets[i].y < 0) {
						bullets[i].y = HEIGHT - 1;
					}
					bullets[i].x %= WIDTH;
					bullets[i].y %= HEIGHT;
				}
			}

			for (Asteroid asteroid : new ArrayList<>(asteroids)) {
				float dist = (float) Math.sqrt((asteroid.x - ship.x) * (asteroid.x - ship.x) + (asteroid.y - ship.y) * (asteroid.y - ship.y));
				if (dist < ((asteroid.size * Asteroid.RENDER_MULT / 2) + (ship.SIZE / 2))) {
					ship.setAlive(false);
				}

				for (int i = 0; i < bullets.length; i++) {
					if (bullets[i] != null) {
						dist = (float) Math.sqrt((asteroid.x - bullets[i].x) * (asteroid.x - bullets[i].x) + (asteroid.y - bullets[i].y) * (asteroid.y - bullets[i].y));
						if (dist < asteroid.size * Asteroid.RENDER_MULT / 2) {
							bullets[i] = null;
							if (asteroid.size > 1) {
								for (Asteroid a : asteroid.split()) {
									asteroids.add(a);
								}
							}
							asteroids.remove(asteroid);
						}
					}
				}
				asteroid.x += asteroid.vx;
				asteroid.y += asteroid.vy;
				if (asteroid.x < 0) {
					asteroid.x = WIDTH - 1;
				}
				if (asteroid.y < 0) {
					asteroid.y = HEIGHT - 1;
				}
				asteroid.x %= WIDTH;
				asteroid.y %= HEIGHT;
			}

			if (display) {
				try {
					Thread.sleep(10);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				frame.repaint();
			}
			tick++;
		}
		frame.dispose();
		return tick;
	}

	class Asteroid {
		private float x, y;
		private float vx, vy;
		private int size = 3;
		private static final int RENDER_MULT = 20;

		public Asteroid() {
			int x = (int) Math.round(Math.random());
			int y = (int) Math.round(Math.random());
			this.x = x * WIDTH;
			this.y = y * HEIGHT;
			this.vx = (float) (Math.random() * 2);
			this.vy = (float) (Math.random() * 2);
		}

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

	class Bullet {
		private float x, y;
		private float vx, vy;

		public Bullet(int x, int y, float angle) {
			this.x = x;
			this.y = y;
			this.vx = (float) (Math.cos(angle) * 2);
			this.vy = (float) (Math.sin(angle) * 2);
		}
	}

	class Ship {
		private float x, y;
		private float angle;
		private final int SIZE = 20;
		private boolean alive = true;
		private Polygon poly;

		public Ship() {
			poly = new Polygon(new int[] { 10, -10, -10 }, new int[] { 0, 5, -5 }, 3);
			this.x = WIDTH / 2;
			this.y = HEIGHT / 2;
			this.angle = (float) -(Math.PI / 2);
		}

		public float getAngle() {
			return angle;
		}

		public void setAngle(float angle) {
			this.angle = angle;
		}

		public float getX() {
			return x;
		}

		public void setX(float x) {
			this.x = x;
		}

		public float getY() {
			return y;
		}

		public void setY(float y) {
			this.y = y;
		}

		public boolean isAlive() {
			return alive;
		}

		public void setAlive(boolean alive) {
			this.alive = alive;
		}
	}
}
