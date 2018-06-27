package me.pv.mg.client.simulation;

import java.awt.Color;
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
	private NeuralNetwork nn;
	public static final int WIDTH = 1000;
	public static final int HEIGHT = 720;
	private boolean forward = false;

	public AsteroidSimulator() {
		this.asteroids = new ArrayList<>();
		this.ship = new Ship();
		this.bullets = new Bullet[5];
	}

	@Override
	public void paint(Graphics2D g) {
		g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

		nn.display(g, WIDTH, 0, 320, HEIGHT);

		g.setColor(Color.black);
		g.fillRect(0, 0, WIDTH, HEIGHT);
		g.setColor(Color.WHITE);

		for (Asteroid asteroid : new ArrayList<>(asteroids)) {
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
		if(forward) {
        		g.drawPolygon(ship.boost);
		}
	}

	@Override
	public float simulate(NeuralNetwork nn, boolean display) {
		this.nn = nn;
		float tick = 0;
		float score = 1;
		float hits = 1;
		float shots = 1;
		int ascount = 4;
		int spawnCountdown = 10000;
		int bulletTime = 60;
		Display frame = null;
		if (display) {
			frame = new Display(WIDTH + 300, HEIGHT, this);
			frame.setVisible(true);
		}

		while (ship.isAlive()) {

			float[] input = new float[8];
			for (int i = 0; i < 8; i++) {
				double angle = 2 * Math.PI * i / 8;
				float vx = (float) (Math.cos(angle + ship.angle));
				float vy = (float) (Math.sin(angle + ship.angle));
				float min = Float.MAX_VALUE;
				for (Asteroid asteroid : new ArrayList<>(asteroids)) {
					for (int j = 0; j < 4; j++) {
						float ax = 0, ay = 0;
						if (j == 0) {
							ax = asteroid.x;
							ay = asteroid.y;
						} else if (j == 1) {
							ax = asteroid.x > WIDTH / 2 ? asteroid.x - WIDTH : asteroid.x + WIDTH;
							ay = asteroid.y > HEIGHT / 2 ? asteroid.y - HEIGHT : asteroid.y + HEIGHT;
						} else if (j == 2) {
							ax = asteroid.x > WIDTH / 2 ? asteroid.x - WIDTH : asteroid.x + WIDTH;
							ay = asteroid.y;
						} else {
							ax = asteroid.x;
							ay = asteroid.y > HEIGHT / 2 ? asteroid.y - HEIGHT : asteroid.y + HEIGHT;
						}
						float ux = ax - ship.x;
						float uy = ay - ship.y;
						float dot = ux * vx + uy * vy;
						if (dot < 0) {
							continue;
						}
						float normu = (float) Math.sqrt(ux * ux + uy * uy);
						float projx = dot * vx;
						float projy = dot * vy;
						float anglevu = (float) Math.acos(dot / normu);
						if (anglevu > Math.PI / 8) {
							continue;
						}
						float distProj = (float) Math.sqrt(projx * projx + projy * projy);
						if (distProj - asteroid.size * Asteroid.RENDER_MULT / 2 < min) {
							min = distProj - asteroid.size * Asteroid.RENDER_MULT / 2;
						}
					}
				}
				input[i] = 1.0f / min;
			}

			float[] out = nn.propagateForward(input);

			for (int i = 0; i < bullets.length; i++) {
				if (bullets[i] == null && bulletTime == 0 && out[0] > 0.8) {
					bulletTime = 60;
					shots++;
					bullets[i] = new Bullet((int) ship.x, (int) ship.y, ship.angle);
				} else if (bullets[i] != null) {
					if (bullets[i].ttl <= 0) {
						bullets[i] = null;
						continue;
					}
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
					bullets[i].ttl--;
				}
			}

			if (out[1] > 0.8 && out[1] > out[2]) {
				ship.angle += 0.08f;
			} else if (out[2] > 0.8 && out[2] > out[1]) {
				ship.angle -= 0.08f;
			}

			if (out[3] > 0.8) {
				ship.forward();
				forward = true;
			} else {
				forward = false;
			}
			ship.update();

			if (bulletTime > 0) {
				bulletTime--;
			}
			if (asteroids.size() == 0 || spawnCountdown-- == 0) {
				spawnCountdown = 10000;
				if(asteroids.size() == 0 && ascount != 4) {
					score += 10;
				}
				for (int i = 0; i < ascount; i++) {
					if (i == 0 && ascount == 4) {
						Asteroid a = new Asteroid();
						a.x = 0;
						a.y = 0;
						a.vy = (float) 1.5f;
						a.vx = (float) 2;
						asteroids.add(a);
					} else
						asteroids.add(new Asteroid());
				}
				ascount++;
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
							score++;
							hits++;
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
					frame.setTitle("Asteroid | Fitness: "+(tick * score * 10 + score * (hits / shots) * (hits / shots)));
					Thread.sleep(10);
				} catch (InterruptedException e) {
					e.printStackTrace();
				}
				frame.repaint();
			}
			tick++;
		}
		if (frame != null) {
			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
			frame.dispose();
		}
		return tick * score * 10 + score * (hits / shots) * (hits / shots);
	}

	class Asteroid {
		private float x, y;
		private float vx, vy;
		private int size = 4;
		private static final int RENDER_MULT = 32;

		public Asteroid() {
			float dist = 0;
			do {
        			double x = Math.random();
        			double y = Math.random();
        			this.x = (float) (x * WIDTH);
        			this.y = (float) (y * HEIGHT);
        			dist = (float) Math.sqrt((this.x - ship.x) * (this.x - ship.x) + (this.y - ship.y) * (this.y - ship.y));
			} while(dist < this.size * Asteroid.RENDER_MULT * 2);
			this.vx = (float) (Math.random() * 4) - 2;
			this.vy = (float) (Math.random() * 4) - 2;
		}

		/**
		 * Splits the asteroid into 2 little asteroids
		 * @return		Array with 2 asteroid objects
		 */
		public Asteroid[] split() {
			Asteroid[] childs = new Asteroid[2];
			for (int i = 0; i < childs.length; i++) {
				childs[i] = new Asteroid();
				childs[i].x = this.x;
				childs[i].y = this.y;
				childs[i].vx = (float) (this.vx + (Math.random() / 2));
				childs[i].vy = (float) (this.vy + (Math.random() / 2));
				childs[i].size = this.size / 2;
			}
			return childs;
		}
	}

	class Bullet {
		private float x, y;
		private float vx, vy;
		private float ttl = 110;

		public Bullet(int x, int y, float angle) {
			this.x = x;
			this.y = y;
			this.vx = (float) (Math.cos(angle) * 6);
			this.vy = (float) (Math.sin(angle) * 6);
		}
	}

	class Ship {
		private float x, y;
		private float vx, vy;
		private float angle;
		private final int SIZE = 40;
		private final int MAX_SPEED = 10;
		private boolean alive = true;
		private Polygon poly;
		private Polygon boost;

		public Ship() {
			poly = new Polygon(new int[] { SIZE / 2, -SIZE / 2, -SIZE / 2 }, new int[] { 0, SIZE / 3, -SIZE / 3 }, 3);
			boost = new Polygon(new int[] { -SIZE, -SIZE / 2, -SIZE / 2 }, new int[] { 0, SIZE / 6, -SIZE / 6 }, 3);
			this.x = WIDTH / 2;
			this.y = HEIGHT / 2;
			this.angle = (float) -(Math.PI / 2);
		}

		/**
		 * Move the ship forward
		 */
		public void forward() {
			this.vx += Math.cos(angle) * 0.3;
			this.vy += Math.sin(angle) * 0.3;
			if (this.vx * this.vx + this.vy * this.vy > MAX_SPEED * MAX_SPEED) {
				float div = (float) Math.sqrt(this.vx * this.vx + this.vy * this.vy);
				this.vx = this.vx / div * MAX_SPEED;
				this.vy = this.vy / div * MAX_SPEED;
			}
		}

		/**
		 * Update the ship position and speed
		 */
		public void update() {
			this.x += vx;
			this.y += vy;
			this.vx /= 1.02f;
			this.vy /= 1.02f;
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
