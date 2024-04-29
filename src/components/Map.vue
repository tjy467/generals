<script setup>
import { ref, reactive, onMounted } from "vue";
import MapHandler from "./game/MapHandler.js";
import { useRoute } from 'vue-router';
import axios from "axios";
const n = ref(0);
const mapPos = reactive({X: 0, Y: 0});
const focus = reactive({X: 0, Y: 0});
var isDragging = false;
var startX,startY,nowX,nowY;
const dragStart = function(event){
	isDragging = true;
	startX = nowX = event.clientX;
	startY = nowY = event.clientY;
};
const dragEnd = function(){
	isDragging = false;
};
const dragging = function(event){
	if(isDragging){
		mapPos.X += event.clientX - nowX;
		mapPos.Y += event.clientY - nowY;
		nowX = event.clientX;
		nowY = event.clientY;
	}
}
var mapHandler;
const view = ref(), number = ref();
var player = 1;
const updateMap = function(){
	for(let i = 1; i <= n.value; i++){
		for(let j = 1; j <= n.value; j++){
			view.value[i][j] = mapHandler.viewType(player, i, j, focus);
			number.value[i][j] = mapHandler.viewNumber(i, j);
		}
	}
};
const load = function(mapId){
	axios.get(`/api/map/${mapId}`).then(res => {
		mapHandler = new MapHandler;
		mapHandler.init(res.data);
		let _n = mapHandler.n;
		let newArr = () => new Array(_n + 1).fill(0).map(() => new Array(_n + 1));
		view.value = reactive(newArr());
		number.value = reactive(newArr());
		n.value = _n;
		updateMap();
	});
}
const moveList = [];
const trymove = function(i, j, di, dj){
	if(moveList.length >= 20)return;
	moveList.push({player, i, j, di, dj});
	updateArrows();
};
const arrows = reactive([[],[],[],[]]);
const updateArrows = function(){
	for(let i = 0; i < 4; i++)arrows[i].splice(0);
	for(let i = 0; i < moveList.length; i++){
		let mv = moveList[i];
		let x = (mv.i - 0.5) * 45 - 10, y = (mv.j - 0.5) * 45 - 10, h = 45 / 2;
		if(mv.di < mv.i){
			arrows[0].push({x: x - h, y});
		}else if(mv.di > mv.i){
			arrows[1].push({x: x + h, y});
		}else if(mv.dj < mv.j){
			arrows[2].push({x, y: y - h});
		}else if(mv.dj > mv.j){
			arrows[3].push({x, y: y + h});
		}
	}
}
const clicked = function(event, i, j){
	if(event.clientX != startX || event.clientY != startY)return;
	let classlist = event.target.getAttribute("class");
	if(classlist.includes("target")){
		trymove(focus.X, focus.Y, i, j);
		focus.X = i;
		focus.Y = j;
	}else if(classlist.includes("selectable")){
		focus.X = i;
		focus.Y = j;
	}else{
		focus.X = 0;
		focus.Y = 0;
	}
	updateMap();
}
const moveKey = [["w", "ArrowUp"], ["a", "ArrowLeft"], ["s", "ArrowDown"], ["d", "ArrowRight"]];
const keyDown = function(event){
	if(focus.X == 0 && focus.Y == 0)return;
	let oldX = focus.X, oldY = focus.Y;
	let direction = moveKey.map(keys => keys.includes(event.key));
	if(direction[0] && focus.X > 1)focus.X--;
	else if(direction[1] && focus.Y > 1)focus.Y--;
	else if(direction[2] && focus.X < n.value)focus.X++;
	else if(direction[3] && focus.Y < n.value)focus.Y++;
	else return;
	trymove(oldX, oldY, focus.X, focus.Y);
	updateMap();
};
const turn = ref(0);
const handleMessage = function(message){
	if(message.type == "tick"){
		turn.value += 0.5;
		mapHandler.tick();
		let mv = {}, flag = false;
		if(moveList.length > 0){
			mv = moveList[0];
			moveList.shift();
			flag = mapHandler.trymove(mv.player, mv.i, mv.j, mv.di, mv.dj);
			if(!flag)moveList.splice(0);
		}
		updateArrows();
		if(flag){
			let message = {
				type: "movement",
				movement: mv
			};
			ws.send(JSON.stringify(message));
		}
	}else if(message.type == "movement"){
		let mv = message.movement;
		if(mv.player == player)return;
		mapHandler.trymove(mv.player, mv.i, mv.j, mv.di, mv.dj);
	}else if(message.type == "options"){
		if(message.content == "map"){
			load(message.value);
		}
	}else return;
	updateMap();
}
var ws;
onMounted(() => {
	document.addEventListener("keydown", keyDown);
	let roomId = useRoute().params.id;
	let path = `ws://${window.location.host}/api/room/${roomId}`;
	ws = new WebSocket(path);
	ws.onmessage = (message) => {
		let data = JSON.parse(message.data);
		handleMessage(data);
	};
});
const switchPlayer = function(){
	let players = mapHandler.players;
	player = (player + 1) % players;
	if(player == 0)player = players;
	updateMap();
	console.log(`switch to player ${player}`);
};
const gameBegin = function(){
	ws.send('{"type": "begin"}');
};
const gameReset = function(){
	turn.value = 0;
	ws.send('{"type": "stop"}');
	let message = {
		type: "options",
		content: "map",
		value: 1
	};
	ws.send(JSON.stringify(message));
};
</script>

<template>
  <div id="turn-counter" class="rect">
	Turn {{ Math.trunc(turn) }}
  </div>
  <div id="switch-player" class="rect" @click="switchPlayer">
	Switch
  </div>
  <div id="game-begin" class="rect" @click="gameBegin">
	Begin
  </div>
  <div id="game-reset" class="rect" @click="gameReset">
	Reset
  </div>
  <div id="background" @mousedown="dragStart" @mouseup="dragEnd" @mousemove="dragging">
	<div id="map-board" :style="{top: mapPos.Y + 'px', left: mapPos.X + 'px'}">
	  <div v-for="i in n" class="map-row">
		<div v-for="j in n" class="map-item" @click="clicked($event, i, j)" :class="view[i][j]">
		  {{ number[i][j] }}
		</div>
	  </div>
	  <div v-for="arrow in arrows[0]" class="arrow" :style="{top: arrow.x + 'px', left: arrow.y + 'px'}">
		↑
	  </div>
	  <div v-for="arrow in arrows[1]" class="arrow" :style="{top: arrow.x + 'px', left: arrow.y + 'px'}">
		↓
	  </div>
	  <div v-for="arrow in arrows[2]" class="arrow" :style="{top: arrow.x + 'px', left: arrow.y + 'px'}">
		←
	  </div>
	  <div v-for="arrow in arrows[3]" class="arrow" :style="{top: arrow.x + 'px', left: arrow.y + 'px'}">
		→
	  </div>
	</div>
  </div>
</template>

<style scoped>
#background{
	position:absolute;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: #222;
	overflow: hidden;
	z-index: -100;
}
#map-board{
	position: absolute;
}
.map-row{
	display: flex;
}
.map-item{
	height: 45px;
	width: 45px;
	box-sizing: border-box;
	border: 1px solid black;
	caret-color: transparent;
	background-position: center;
	background-size: 36px;
	background-repeat: no-repeat;
	text-align: center;
	line-height: 45px;
	color: white;
	font-size: 18px;
}
.empty{
	background-color: white;
}
.visible0{
	background-color: rgba(255, 255, 255, 0.1) !important;
	border: none !important;
	color: transparent;
}
.visible1{
	background-color: rgb(220, 220, 220);
}
.selected{
	border: 1px solid white !important;
}
.target{
	background-color: gray;
}
.base{
	background-image: url('/assets/image/crown.png');
}
.obstacle{
	background-image: url('/assets/image/obstacle.png');
}
.mountain{
	background-image: url('/assets/image/mountain.png');
	background-color: #bbb;
}
.city{
	background-image: url('/assets/image/city.png');
	background-color: gray;
}
.swamp{
	background-image: url('/assets/image/swamp.png');
	background-color: gray;
}
.belong1{
	background-color: red;
}
.belong1.target{
	background-color: rgb(128, 0, 0);
}
.belong2{
	background-color: blue;
}
.belong2.target{
	background-color: rgb(0, 0, 128);
}
.rect{
	padding: 5px;
	background-color: white;
	text-align: center;
	box-shadow: rgb(0, 128, 128) 2px 2px 0px 0px;
}
#turn-counter{
	position: absolute;
	top: 0px;
	left: 0px;
	height: 20px;
	width: 84px;
	line-height: 20px;
}
#switch-player{
	position: absolute;
	top: 0px;
	left: 100px;
	height: 20px;
	width: 84px;
	line-height: 20px;
	user-select: none;
}
#game-begin{
	position: absolute;
	top: 0px;
	left: 200px;
	height: 20px;
	width: 84px;
	line-height: 20px;
	user-select: none;
}
#game-reset{
	position: absolute;
	top: 0px;
	left: 300px;
	height: 20px;
	width: 84px;
	line-height: 20px;
	user-select: none;
}
.arrow{
	position: absolute;
	height: 20px;
	width: 20px;
	text-align: center;
	line-height: 20px;
	color: white;
}
</style>