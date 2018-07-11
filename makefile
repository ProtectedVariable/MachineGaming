all: proto
proto:
	protoc --js_out=import_style=commonjs,binary:server/ protobuf/mg.proto
	protoc --java_out=client/src protobuf/mg.proto
