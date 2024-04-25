import MapHandler from './src/components/game/MapHandler.js';
import fs from 'fs';
class Room{
	constructor(){
		this.wsClient = [];
		this.mapHandler = new MapHandler;
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
	startGame(){
		this.tick = setInterval(() => {
			this.mapHandler.tick();
			this.wsClient.forEach(ws => {
				ws.send('{"type": "tick"}');
			});
		}, 250);
	}
}
const roomMap = new Map();
const createRoom = function(){
	let id = 0;
	do{
		// id = Math.floor(Math.random()*32768);
		id = 1000;
	}while(roomMap[id] != undefined);
	roomMap[id] = new Room;
	return id;
};
const closeRoom = function(id){
	delete roomMap[id];
};

import express from 'express';
import expressWs from 'express-ws';
const wsapp = express();
expressWs(wsapp);
wsapp.ws('/api/room/:id', (ws, req) => {
	let room = roomMap[req.params.id];
	room.wsClient.push(ws);
	console.log(`connection on ${req.ip}`);
	ws.on("message", (message) => {
		let data = JSON.parse(message);
		room.handleMessage(data);
		room.wsClient.forEach(ws => {
			ws.send(message);
		});
	});
	ws.on("close", () => {
	});
});
export {
	wsapp,
	createRoom,
	closeRoom
};

let id = createRoom();
console.log(id);