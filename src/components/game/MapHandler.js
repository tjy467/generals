const cellTypes = {
	empty: 0,
	mountain: 1,
	swamp: 2,
	city: 3,
	base: 4
};
class MapHandler{
	constructor(){}
	get n(){return this._n;}
	get players(){return this._players;}
	init(mapData){
		this._n = mapData.n;
		this._players = mapData.players;
		this.initMap(mapData.map);
		this.genRate = {};
		this.genRate[cellTypes.empty] = mapData.emptyGenRate;
		this.genRate[cellTypes.city] = mapData.cityGenRate;
		this.genRate[cellTypes.swamp] = -mapData.swampLoseRate;
		this.genRate[cellTypes.base] = mapData.cityGenRate;
	}
	getCell(i, j){
		let type = undefined;
		if(typeof this.map[i][j] == "string")type = "city";
		else if(this.map[i][j] < 0)type = "base";
		else if(this.map[i][j] == cellTypes.empty)type = "empty";
		else if(this.map[i][j] == cellTypes.mountain)type = "mountain";
		else if(this.map[i][j] == cellTypes.swamp)type = "swamp";
		return {
			type:type,
			belong:this.belong[i][j],
			soldier:this.soldier[i][j]
		};
	}
	initMap(map){
		// console.log(map);
		let newArr = () => new Array(this.n + 1).fill(0).map(() => new Array(this.n + 1));
		this.map = newArr();
		this.belong = newArr();
		this.soldier = newArr();
		this.delay = newArr().map(list => list.fill(0));
		for(let i = 1; i <= this.n; i++){
			for(let j = 1; j <= this.n; j++){
				this.map[i][j] = map[i - 1][j - 1];
				let cell = this.getCell(i, j);
				if(cell.type == "base")this.belong[i][j] = -this.map[i][j];
				else this.belong[i][j] = 0;
				if(cell.type == "base")this.soldier[i][j] = 1;
				else if(cell.type == "city")this.soldier[i][j] = Number(this.map[i][j]);
				if(this.soldier[i][j] != undefined)this.delay[i][j] = 0;
			}
		}
		// console.log("map", this.map);
		// console.log("belong", this.belong);
		// console.log("soldier", this.soldier);
		// console.log("delay", this.delay);
	}
	neighbor4(i, j){
		let list = [];
		if(i > 1)list.push([i - 1, j]);
		if(i < this.n)list.push([i + 1, j]);
		if(j > 1)list.push([i, j - 1]);
		if(j < this.n)list.push([i, j + 1]);
		return list;
	}
	neighbor8(i, j){
		let list = [];
		if(i > 1)list.push([i - 1, j]);
		if(i < this.n)list.push([i + 1, j]);
		if(j > 1)list.push([i, j - 1]);
		if(j < this.n)list.push([i, j + 1]);
		if(i > 1 && j > 1)list.push([i - 1, j - 1]);
		if(i > 1 && j < this.n)list.push([i - 1, j + 1]);
		if(i < this.n && j > 1)list.push([i + 1, j - 1]);
		if(i < this.n && j < this.n)list.push([i + 1, j + 1]);
		return list;
	}
	viewType(player, i, j, focus){
		let cell = this.getCell(i, j);
		let result = [];
		let visible = 0;
		let neighbors = this.neighbor8(i, j);
		for(let [di, dj] of neighbors){
			if(this.getCell(di, dj).belong == player){
				visible = 1;
			}
		}
		if(cell.belong == player)visible = 2;
		if(i == focus.X && j == focus.Y)result.push("selected");
		else{
			neighbors = this.neighbor4(i, j);
			let flag = false;
			for(let [di, dj] of neighbors){
				if(di == focus.X && dj == focus.Y){
					flag = true;
				}
			}
			if(flag)result.push("target");
		}
		if(visible > 0)result.push(cell.type);
		else if(cell.type == 'empty')result.push("empty");
		else result.push("obstacle");
		result.push(`visible${visible}`);
		result.push(`belong${cell.belong}`);
		if(cell.belong > 0)result.push("selectable");
		return result;
	}
	viewNumber(i, j){
		let cell = this.getCell(i, j);
		if(cell.soldier > 0)return cell.soldier;
		else return "";
	}
	trymove(player, i, j, di, dj){
		let cell = this.getCell(i, j);
		if(cell.belong != player)return false;
		if(cell.soldier <= 1)return false;
		let moved = cell.soldier - 1;
		cell = this.getCell(di, dj);
		if(cell.type == "empty" || cell.type == "swamp"){
			if(cell.belong == 0){
				this.soldier[di][dj] = moved;
				this.belong[di][dj] = this.belong[i][j];
			}else if(cell.belong == player){
				this.soldier[di][dj] += moved;
			}else{
				this.soldier[di][dj] -= moved;
			}
		}else if(cell.type == "city" || cell.type == "base"){
			if(cell.belong == player){
				this.soldier[di][dj] += moved;
			}else{
				this.soldier[di][dj] -= moved;
			}
		}else return false;
		if(this.soldier[di][dj] < 0){
			this.soldier[di][dj] *= -1;
			this.belong[di][dj] = this.belong[i][j];
		}
		this.soldier[i][j] = 1;
		return true;
	}
	tick(){
		for(let i = 1; i <= this.n; i++){
			for(let j = 1; j <= this.n; j++){
				let cell = this.getCell(i, j);
				if(cell.belong == 0)continue;
				let rate = this.genRate[cellTypes[cell.type]];
				this.delay[i][j] += rate;
				let cnt = Math.trunc(this.delay[i][j]);
				this.delay[i][j] -= cnt;
				this.soldier[i][j] += cnt;
				if(this.soldier[i][j] <= 0){
					this.soldier[i][j] = 0;
					this.belong[i][j] = 0;
				}
			}
		}
	}
}
export default MapHandler;