import { createRouter, createWebHistory } from 'vue-router';
import Game from '../components/Game.vue';
import Home from '../components/Home.vue';
const routes = [
	{path: '/', component: Home},
	{path: '/room/:id', component: Game}
];
const router = createRouter({
	history: createWebHistory(),
	routes
});
export default router;