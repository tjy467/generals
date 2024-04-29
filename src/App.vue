<script setup>
import { RouterView } from 'vue-router';
</script>

<template>
  <main>
    <router-view></router-view>
  </main>
</template>

<style>
@font-face {
	font-family: 'Quicksand';
	src: url('/assets/font/Quicksand-VariableFont_wght.ttf'), format('truetype');
}
*{
	font-family: 'Quicksand', serif;
}
main{
  background-color: #222;
  position: absolute;
  top: 0px;
  left: 0px;
  height: 100vh;
  width: 100vw;
  display: flex;
  z-index: -200;
}
</style>
