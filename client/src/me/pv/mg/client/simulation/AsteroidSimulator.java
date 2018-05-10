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
	public static final int HEIGHT = 500;

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
		/*
		 * for (int i = 0; i < 8; i++) { double angle = 2 * Math.PI * i / 8;
		 * float vx = (float) (Math.cos(angle + ship.angle)); float vy = (float)
		 * (Math.sin(angle + ship.angle));
		 * 
		 * int dx = 0, dy = 0; float min = Float.MAX_VALUE; for (Asteroid
		 * asteroid : new ArrayList<>(asteroids)) { for (int j = 0; j < 2; j++)
		 * { float ax = 0, ay = 0; if (j == 0) { ax = asteroid.x; ay =
		 * asteroid.y; } else { ax = asteroid.x > WIDTH / 2 ? asteroid.x - WIDTH
		 * : asteroid.x + WIDTH; ay = asteroid.y > HEIGHT / 2 ? asteroid.y -
		 * HEIGHT : asteroid.y + HEIGHT; } float ux = ax - ship.x; float uy = ay
		 * - ship.y; float dot = ux * vx + uy * vy; if (dot < 0) { continue; }
		 * float normu = (float) Math.sqrt(ux * ux + uy * uy); float projx = dot
		 * * vx; float projy = dot * vy; float anglevu = (float) Math.acos(dot /
		 * normu); if(anglevu > Math.PI / 8) { continue; } float distProj =
		 * (float) Math.sqrt(projx * projx + projy * projy); if (distProj < min)
		 * { min = distProj; dx = (int) (projx + ship.x); dy = (int) (projy +
		 * ship.y); } } } if(dx != 0 && dy != 0) g.drawLine((int) ship.x, (int)
		 * ship.y, dx, dy); }
		 */
		g.translate((int) ship.x, (int) ship.y);
		g.rotate(ship.angle);
		g.drawPolygon(ship.poly);
	}

	@Override
	public float simulate(NeuralNetwork nn, String fitness, boolean display) {
		float tick = 0;
		float distance = 0;
		int ascount = 4;
		int bulletTime = 60;
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
				Asteroid ma = null;
				for (Asteroid asteroid : new ArrayList<>(asteroids)) {
					for (int j = 0; j < 2; j++) {
						float ax = 0, ay = 0;
						if (j == 0) {
							ax = asteroid.x;
							ay = asteroid.y;
						} else {
							ax = asteroid.x > WIDTH / 2 ? asteroid.x - WIDTH : asteroid.x + WIDTH;
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
						if (distProj < min) {
							min = distProj;
							ma = asteroid;
						}
					}
				}
				int s = ma != null ? ma.size : 0;
				input[i] = 1.0f / (min - (ship.SIZE / 2) - (s * Asteroid.RENDER_MULT / 2));
			}
			
			
			//System.out.println(input[0]+" "+input[1]+" "+input[2]+" "+input[3]+" "+input[4]+" "+input[5]+" "+input[6]+" "+input[7]);
			float[] out = nn.propagateForward(input);
			//System.out.println(out[0]+" "+out[1]+" "+out[2]+" "+out[3]);
			
			/*
			out[0] = frame.down ? 1 : 0;
			out[1] = frame.right ? 1 : 0;
			out[2] = frame.left ? 1 : 0;
			out[3] = frame.up ? 1 : 0;
			*/
			
			for (int i = 0; i < bullets.length; i++) {
				if (bullets[i] == null && bulletTime == 0 && out[0] > 0.8) {
					bulletTime = 60;
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
				ship.angle += 0.05f;
			} else if (out[2] > 0.8 && out[2] > out[1]) {
				ship.angle -= 0.05f;
			}

			if (out[3] > 0.8) {
				ship.forward();
				distance++;
			}
			ship.update();

			if (bulletTime > 0) {
				bulletTime--;
			}
			if (asteroids.size() == 0) {
				for (int i = 0; i < ascount; i++) {
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
		if (frame != null) {
			frame.dispose();
		}
		return tick;
	}

	class Asteroid {
		private float x, y;
		private float vx, vy;
		private int size = 3;
		private static final int RENDER_MULT = 40;

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
		private float ttl = 72;

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

		public Ship() {
			poly = new Polygon(new int[] { SIZE / 2, -SIZE / 2, -SIZE / 2 }, new int[] { 0, SIZE / 4, -SIZE / 4 }, 3);
			this.x = WIDTH / 2;
			this.y = HEIGHT / 2;
			this.angle = (float) -(Math.PI / 2);
		}

		public void forward() {
			this.vx += Math.cos(angle) * 0.8;
			this.vy += Math.sin(angle) * 0.8;
			if (this.vx * this.vx + this.vy * this.vy > MAX_SPEED * MAX_SPEED) {
				float div = (float) Math.sqrt(this.vx * this.vx + this.vy * this.vy);
				this.vx = this.vx / div * MAX_SPEED;
				this.vy = this.vy / div * MAX_SPEED;
			}
		}

		public void update() {
			this.x += vx;
			this.y += vy;
			this.vx /= 1.08f;
			this.vy /= 1.08f;
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
