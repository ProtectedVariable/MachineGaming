/**
 * This files contains the network related code
 * 
 * @author Thomas Ibanez
 */
package me.pv.mg.client.network;

import java.io.DataInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.net.Socket;
import java.nio.ByteBuffer;

import com.google.protobuf.GeneratedMessageV3;

import me.pv.mg.client.Client;
import me.pv.mg.protobuf.Mg.MGComputeRequest;
import me.pv.mg.protobuf.Mg.MGComputeResponse;
import me.pv.mg.protobuf.Mg.MGComputeResult;
import me.pv.mg.protobuf.Mg.MGJoin;
import me.pv.mg.protobuf.Mg.MGJoinResponse;
import me.pv.mg.protobuf.Mg.MGMessages;

public class Network {

	private Socket sock;
	private static final int PORT = 4567;
	private Client parent;
	private DataInputStream input;

	public Network(String ip, Client parent) {
		try {
			this.sock = new Socket(ip, PORT);
			this.parent = parent;
			this.input = new DataInputStream(this.sock.getInputStream());
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	/**
	 * Send a message to join the pool of workers
	 * @param name	The name to give to the server
	 * @param spec	True if joining as a spectator, false otherwise
	 */
	public void joinPool(String name, boolean spec) {
		MGJoin msg = MGJoin.newBuilder().setPrettyName(name).setSpectator(spec).build();
		sendMessage(MGMessages.MG_JOIN, msg);
	}
	
	/**
	 * Sends the resulting fitness of a simulation to the server
	 * @param fitness	The fitness to send
	 * @param time		The time it took to compute the simulation (ms)
	 */
	public void sendResult(float fitness, int time) {
		MGComputeResult msg = MGComputeResult.newBuilder().setFitness(fitness).setTime(time).build();
		sendMessage(MGMessages.MG_COMPUTE_RESULT, msg);
	}
	
	/**
	 * Sends a response to a request from the server
	 * @param cando		True if the client is able to do the simulation, false otherwise
	 */
	public void sendResponse(boolean cando) {
		MGComputeResponse msg = MGComputeResponse.newBuilder().setCanDo(cando).build();
		sendMessage(MGMessages.MG_COMPUTE_RESPONSE, msg);
	}

	/**
	 * Waits for a message to come
	 */
	public void waitNextMessage() {
		try {
			byte[] in_type = new byte[1];
			input.readFully(in_type);

			byte[] in_size = new byte[4];
			input.readFully(in_size);
			ByteBuffer bb = ByteBuffer.wrap(in_size);
			int size = bb.getInt();

			byte[] in_msg = new byte[size];
			input.readFully(in_msg);

			switch (MGMessages.forNumber(in_type[0])) {
				case MG_COMPUTE_REQUEST:
					MGComputeRequest cr = MGComputeRequest.parseFrom(in_msg);
					this.parent.startSimulation(cr.getComputeInfo().getGame(), cr.getGenome(), cr.getComputeInfo().getNetMetadata(), cr.getComputeInfo().getNetType());
					break;
				case MG_END:
					System.exit(0);
					return;
				case MG_JOIN_RESPONSE:
					MGJoinResponse jr = MGJoinResponse.parseFrom(in_msg);
					if(jr.getAccepted() == false) {
						System.out.println("Join denied: "+jr.getReason());
						System.exit(0);
					}
					break;
				default:
					break;
			}
		} catch(EOFException e) {
			//No Do
		} catch (IOException e) {
			e.printStackTrace();
			System.exit(1);
		}
	}

	/**
	 * Sends a message to the server
	 * @param type	Type of the message
	 * @param msg	Message object
	 */
	private void sendMessage(MGMessages type, GeneratedMessageV3 msg) {
		byte[] out = new byte[msg.getSerializedSize() + 2];
		out[0] = (byte) type.getNumber();
		out[1] = (byte) msg.getSerializedSize();
		for (int i = 0; i < msg.getSerializedSize(); i++) {
			out[2 + i] = msg.toByteArray()[i];
		}
		try {
			sock.getOutputStream().write(out);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
