package me.pv.mg.client.simulation;

import java.awt.Graphics2D;
import java.awt.Polygon;
import java.awt.RenderingHints;
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
		g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

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

			float[] input = new float[8];
			for (int i = 0; i < 8; i++) {
				double angle = 2 * Math.PI * i / 8;
				float vx = (float) (Math.cos(angle + ship.angle));
				float vy = (float) (Math.sin(angle + ship.angle));

				float min = Float.MAX_VALUE;
				for (Asteroid asteroid : asteroids) {
					float ux = asteroid.x - ship.x;
					float uy = asteroid.y - ship.y;

					float dot = ux * vx + uy * vy;
					if(dot < 0) {
						continue;
					}
					float projx = dot * vx;
					float projy = dot * vy;
					float dist = (float) Math.sqrt(projx * projx + projy * projy);
					if (dist < min) {
						min = dist;
					}
				}
				input[i] = 1.0f / min;
			}
			float[] out = nn.propagateForward(input);

			for (int i = 0; i < bullets.length; i++) {
				if (bullets[i] == null && bulletTime == 0 && out[0] > 0.5) {
					bulletTime = 30;
					bullets[i] = new Bullet((int) ship.x, (int) ship.y, ship.angle);
				} else if (bullets[i] != null) {
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

			
			if (out[1] > 0.5 && out[1] > out[2]) {
				ship.angle += 0.05f;
			} else if (out[2] > 0.5 && out[2] > out[1]) {
				ship.angle -= 0.05f;
			}

			if (out[3] > 0.5) {
				ship.forward();
			}

			if (bulletTime > 0) {
				bulletTime--;
			}
			if (asteroids.size() == 0) {
				ascount++;
				for (int i = 0; i < ascount; i++) {
					if(i == 0) {
						Asteroid a = new Asteroid();
						a.x = 0;
						a.y = 0;
						a.vx = a.vy = 1;
						asteroids.add(a);
					} else {
						asteroids.add(new Asteroid());
					}
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
		if(frame != null) {
			frame.dispose();
		}
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
			this.vx = (float) (Math.random() * 4) - 2;
			this.vy = (float) (Math.random() * 4) - 2;
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

		public void forward() {
			this.x += Math.cos(angle) * 3;
			this.y += Math.sin(angle) * 3;
			if (this.x < 0) {
				this.x = WIDTH - 1;
			}
			if (this.y < 0) {
				this.y = HEIGHT - 1;
			}
			this.x %= WIDTH;
			this.y %= HEIGHT;
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
