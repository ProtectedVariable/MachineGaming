package me.pv.mg.test;

import java.io.IOException;
import java.net.Socket;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;

import me.pv.mg.protobuf.Mg.MGComputeRequest;
import me.pv.mg.protobuf.Mg.MGComputeResponse;
import me.pv.mg.protobuf.Mg.MGComputeResult;
import me.pv.mg.protobuf.Mg.MGEnd;
import me.pv.mg.protobuf.Mg.MGJoin;
import me.pv.mg.protobuf.Mg.MGJoinResponse;
import me.pv.mg.protobuf.Mg.MGMessages;

public class Test {
 
	static Socket sock;
	
	public static void main(String[] args) throws UnknownHostException, IOException, InterruptedException {
		sock = new Socket("127.0.0.1", 4567);
		MGJoin msg = MGJoin.newBuilder().setPrettyName("ClientTest").build();
		byte[] out = new byte[msg.getSerializedSize() + 2];
		out[0] = (byte) MGMessages.MG_JOIN.getNumber();
		out[1] = (byte) msg.getSerializedSize();
		for(int i = 0; i < msg.getSerializedSize(); i++) {
			out[2 + i] = msg.toByteArray()[i];
		}
		sock.getOutputStream().write(out);
		
		while(true) {
        		byte[] in_type = new byte[1];
        		sock.getInputStream().read(in_type);
        
        		byte[] in_size = new byte[4];
        		sock.getInputStream().read(in_size);
        		ByteBuffer bb = ByteBuffer.wrap(in_size);
        		int size = bb.getInt();

        		byte[] in_msg = new byte[size];
        		sock.getInputStream().read(in_msg);
        		
        		switch(MGMessages.forNumber(in_type[0])) {
					case MG_COMPUTE_REQUEST:
						System.out.println(MGMessages.forNumber(in_type[0])+" "+MGComputeRequest.parseFrom(in_msg));
						sendComputeResponse();
						Thread.sleep(10);
						sendComputeResult();
						break;
					case MG_END:
						System.out.println(MGMessages.forNumber(in_type[0])+" "+MGEnd.parseFrom(in_msg));
						return;
					case MG_JOIN_RESPONSE:
						System.out.println(MGMessages.forNumber(in_type[0])+" "+MGJoinResponse.parseFrom(in_msg));
						break;
        		}
		}
	}
	
	public static void sendComputeResponse() throws IOException {
		MGComputeResponse msg = MGComputeResponse.newBuilder().setCanDo(true).build();
		byte[] out = new byte[msg.getSerializedSize() + 2];
		out[0] = (byte) MGMessages.MG_COMPUTE_RESPONSE.getNumber();
		out[1] = (byte) msg.getSerializedSize();
		for(int i = 0; i < msg.getSerializedSize(); i++) {
			out[2 + i] = msg.toByteArray()[i];
		}
		sock.getOutputStream().write(out);
	}
	
    public static void sendComputeResult() throws IOException {
    		MGComputeResult msg = MGComputeResult.newBuilder().setFitness((float)Math.random() * 1000).setTime(10).build();
		byte[] out = new byte[msg.getSerializedSize() + 2];
		out[0] = (byte) MGMessages.MG_COMPUTE_RESULT.getNumber();
		out[1] = (byte) msg.getSerializedSize();
		for(int i = 0; i < msg.getSerializedSize(); i++) {
			out[2 + i] = msg.toByteArray()[i];
		}
		sock.getOutputStream().write(out);
    	}
}
