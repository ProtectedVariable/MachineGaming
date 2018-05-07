package me.pv.mg.client.simulation;

import java.awt.BorderLayout;
import java.awt.Graphics;
import java.awt.Graphics2D;

import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.border.EmptyBorder;

public class Display extends JFrame {

	private static final long serialVersionUID = 7155015806747010932L;
	private DisplayPanel contentPane;
	private Simulator parent;

	public Display(int width, int height, Simulator s) {
		setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
		setBounds(100, 100, width, height);
		contentPane = new DisplayPanel();
		contentPane.setBorder(new EmptyBorder(5, 5, 5, 5));
		contentPane.setLayout(new BorderLayout(0, 0));
		setContentPane(contentPane);
		this.parent = s;
	}
	
	class DisplayPanel extends JPanel {
		private static final long serialVersionUID = -8357439850680313124L;
		
		@Override
		public void paint(Graphics g) {
			parent.paint((Graphics2D) g.create());
		}
	}

}
