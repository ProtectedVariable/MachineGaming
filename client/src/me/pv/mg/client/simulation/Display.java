/**
 * This files contains a jframe class to display game progress
 * 
 * @author Thomas Ibanez
 */
package me.pv.mg.client.simulation;

import java.awt.BorderLayout;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

public class Display extends JFrame implements KeyListener {

	private static final long serialVersionUID = 7155015806747010932L;
	private DisplayPanel contentPane;
	private Simulator parent;
	
	public boolean up, down, left, right;

	public Display(int width, int height, Simulator s) {
		setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
		setBounds(100, 100, width, height);
		contentPane = new DisplayPanel();
		contentPane.setBorder(new EmptyBorder(5, 5, 5, 5));
		contentPane.setLayout(new BorderLayout(0, 0));
		setContentPane(contentPane);
		addKeyListener(this);
		this.parent = s;
	}
	
	class DisplayPanel extends JPanel {
		private static final long serialVersionUID = -8357439850680313124L;
		
		@Override
		public void paint(Graphics g) {
			parent.paint((Graphics2D) g.create());
		}
	}

	@Override
	public void keyTyped(KeyEvent e) {
		
	}

	@Override
	public void keyPressed(KeyEvent e) {
		if(e.getKeyCode()== KeyEvent.VK_RIGHT)
			right = true;
        else if(e.getKeyCode()== KeyEvent.VK_LEFT)
        		left = true;
        else if(e.getKeyCode()== KeyEvent.VK_DOWN)
        		down = true;
        else if(e.getKeyCode()== KeyEvent.VK_UP)
        		up = true;		
	}

	@Override
	public void keyReleased(KeyEvent e) {
		if(e.getKeyCode()== KeyEvent.VK_RIGHT)
			right = false;
        else if(e.getKeyCode()== KeyEvent.VK_LEFT)
        		left = false;
        else if(e.getKeyCode()== KeyEvent.VK_DOWN)
        		down = false;
        else if(e.getKeyCode()== KeyEvent.VK_UP)
        		up = false;		
	}

}
