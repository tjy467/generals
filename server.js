import path from 'node:path'
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from 'express';
import expressWs from 'express-ws';
import { wsapp } from './room.js'
const app = express();
expressWs(app);
app.get('/api/map/:id', (req, res) => {
	let id = req.params.id;
	res.sendFile(__dirname + `/assets/assets/map/${id}.json`);
});
app.use(express.static('./assets'));
app.use(wsapp);
app.listen(3000, () => {
	console.log("server started.");
});