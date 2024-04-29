import MapHandler from './src/components/game/MapHandler.js';
import fs from 'fs';
import WebSocket from 'ws';
class Room{
	constructor(){
		this.wsClient = [];
		this.mapHandler = new MapHandler;
		this.checkAliveTimer = setInterval(function(){
			this.checkAlive();
		}.bind(this), 10000);
	}
	startGame(){
		this.tick = setInterval(() => {
			this.mapHandler.tick();
			this.wsClient.forEach(ws => {
				ws.send('{"type": "tick"}');
			});
		}, 250);
	}
	checkAlive(){
		for(let i = 0; i < this.wsClient.length; i++){
			let ws = this.wsClient[i];
			if(ws.readyState == WebSocket.CLOSING || ws.readyState == WebSocket.CLOSED){
				this.wsClient.splice(i, 1);
			}
		}
		if(this.wsClient.length == 0){
			clearInterval(this.checkAliveTimer);
			this.closeCallback();
		}
	}
	handleMessage(message){
		if(message.type == "options"){
			if(message.content == "map"){
				let path = `./assets/assets/map/${message.value}.json`;
				let data = fs.readFileSync(path);
				this.mapHandler.init(JSON.parse(data));
			}
		}else if(message.type == "movement"){
			let mv = message.movement;
			this.mapHandler.trymove(mv.player, mv.i, mv.j, mv.di, mv.dj);
		}else if(message.type == "begin"){
			this.startGame();
		}else if(message.type == "stop"){
			clearInterval(this.tick);
		}
	}
}
const roomMap = new Map;
const createRoom = function(id){
	console.log(`Room ${id} created.`);
	roomMap[id] = new Room;
};
const closeRoom = function(id){
	console.log(`Room ${id} closed.`);
	delete roomMap[id];
};

import express from 'express';
import expressWs from 'express-ws';
const wsapp = express();
expressWs(wsapp);
wsapp.ws('/api/room/:id', (ws, req) => {
	let id = req.params.id;
	if(roomMap[id] == undefined){
		createRoom(id);
	}
	let room = roomMap[id];
	room.closeCallback = () => {
		closeRoom(id);
	};
	room.wsClient.push(ws);
	ws.on("message", (message) => {
		let data = JSON.parse(message);
		room.handleMessage(data);
		room.wsClient.forEach(ws => {
			ws.send(message);
		});
	});
	ws.on("close", () => {
		room.checkAlive();
	});
});
export {
	wsapp,
	createRoom,
	closeRoom
};