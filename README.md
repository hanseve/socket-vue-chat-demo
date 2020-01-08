# Socket.IO Chat

A simple chat demo for socket.io

## How to use
Tips: Only for local development not production!!! 

```
$ cd path/to/socket-chat-example
$ mkdir ./encryption && cd ./encryption

#create Self-signed certificate

$ openssl genrsa -des3 -out server.pass.key 2048
$ openssl rsa -in server.pass.key -out server.key
 
$ openssl req -new -key server.key -out server.csr -subj "/C=CN/ST=Guangdong/L=ShenZhen/O=localhost/OU=localhost/CN=localshot.test"

$ openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```
Then add server.crt file to you local keychain.(you can simply double click this file and follow the system tip)
```
$ npm install
$ npm run build
$ npm run start
```
You may need add ```127.0.0.1  localhost.test``` to your hosts.
And point your browser to `http://localhost.test:4433`. 

## Features

- Multiple users can join a chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- A notification is sent to all users when a user joins or leaves
the chatroom.
- Secure connection with Https/Wss
- Just for local development

> Reference
[https://github.com/socketio/socket.io/tree/master/examples/chat](https://github.com/socketio/socket.io/tree/master/examples/chat)
