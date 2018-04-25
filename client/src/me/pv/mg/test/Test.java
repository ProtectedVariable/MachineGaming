package me.pv.mg.test;

import java.io.IOException;
import java.net.Socket;
import java.net.UnknownHostException;

import me.pv.mg.protobuf.Mg.MGJoin;
import me.pv.mg.protobuf.Mg.MGJoinResponse;
import me.pv.mg.protobuf.Mg.MGMessages;

public class Test {
 
	public static void main(String[] args) throws UnknownHostException, IOException {
		Socket sock = new Socket("127.0.0.1", 4567);
		MGJoin msg = MGJoin.newBuilder().setPrettyName("ClientTest").build();
		byte[] out = new byte[msg.getSerializedSize() + 2];
		out[0] = (byte) MGMessages.MG_JOIN.getNumber();
		out[1] = (byte) msg.getSerializedSize();
		for(int i = 0; i < msg.getSerializedSize(); i++) {
			out[2 + i] = msg.toByteArray()[i];
		}
		sock.getOutputStream().write(out);
		
		byte[] in_type = new byte[1];
		sock.getInputStream().read(in_type);

		byte[] in_size = new byte[1];
		sock.getInputStream().read(in_size);

		byte[] in_msg = new byte[in_size[0]];
		sock.getInputStream().read(in_msg);
		
		System.out.println(MGMessages.forNumber(in_type[0])+" "+MGJoinResponse.parseFrom(in_msg));
		
		while(true) {}
	}
	
}
