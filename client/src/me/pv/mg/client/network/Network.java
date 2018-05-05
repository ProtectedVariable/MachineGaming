package me.pv.mg.client.network;

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

	public Network(String ip, Client parent) {
		try {
			this.sock = new Socket(ip, PORT);
			this.parent = parent;
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

	public void joinPool(String name) {
		MGJoin msg = MGJoin.newBuilder().setPrettyName(name).build();
		sendMessage(MGMessages.MG_JOIN, msg);
	}
	
	public void sendResult(float fitness, int time) {
		MGComputeResult msg = MGComputeResult.newBuilder().setFitness(fitness).setTime(time).build();
		sendMessage(MGMessages.MG_COMPUTE_RESULT, msg);
	}
	
	public void sendResponse(boolean cando) {
		MGComputeResponse msg = MGComputeResponse.newBuilder().setCanDo(cando).build();
		sendMessage(MGMessages.MG_COMPUTE_RESPONSE, msg);
	}

	public void waitNextMessage() {
		try {
			byte[] in_type = new byte[1];
			sock.getInputStream().read(in_type);

			byte[] in_size = new byte[4];
			sock.getInputStream().read(in_size);
			ByteBuffer bb = ByteBuffer.wrap(in_size);
			int size = bb.getInt();

			byte[] in_msg = new byte[size];
			sock.getInputStream().read(in_msg);

			switch (MGMessages.forNumber(in_type[0])) {
				case MG_COMPUTE_REQUEST:
					MGComputeRequest cr = MGComputeRequest.parseFrom(in_msg);
					this.parent.startSimulation(cr.getComputeInfo().getGame(), cr.getComputeInfo().getFitness(), cr.getGenome(), cr.getNetMetadata(), cr.getNetType());
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
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

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
