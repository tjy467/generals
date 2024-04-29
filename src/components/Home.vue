<script setup>
const handleInput = function(e){
	let input = e.target;
	if(input.value == "")return;
	let data = Number(input.value.slice(0,4));
	if(Number.isNaN(data))input.value = "";
	else input.value = String(data);
};
const jump = function(){
	let input = document.getElementById("room_input");
	if(input.value == "")return;
	let url = `/room/${input.value}`;
	window.location.href = url;
}
</script>

<template>
<div id="center">
<p>Join Room</p>
<input id="room_input" placeholder="Room ID" @input="handleInput">
<br>
<button id="room_enter" @click="jump">Enter</button>
</div>
</template>

<style scoped>
#center{
	margin: auto auto;
	text-align: center;
}
p{
	margin: auto auto;
	color: white;
	font-size: 30px;
}
#room_input{
	margin: 20px auto;
	outline: none;
	width: 300px;
	height: 50px;
	font-size: 30px;
	text-align: center;
}
#room_enter{
	margin: auto auto;
	width: 150px;
	height: 50px;
	font-size: 30px;
	border: none;
	background-color: white;
	box-shadow: rgb(0, 128, 128) 2px 2px 0px 0px;
}
#room_enter:active{
	box-shadow: none;
	transform: translate3d(2px, 2px, 0px);
}
</style>