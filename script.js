// hier komt de loopaden van met de grenzen en waar je kan lopen als leerling
// hier komt te staan waar je het docent kan plaatsen
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
const sw = canvas.width;
const sh = canvas.height;
const tile = 25;
var bgcolor = "green";
 
class Leerling {
    constructor(pos, color, r, health, attack) {
        this.pos = pos;
        this.color = color;
        this.r = r;
        this.health = health;
        this.attack = attack;
        this.targets = [];
        this.targets[0] = new Vector(pos.x + pathData[0].x, pos.y + pathData[0].y);
        for (let i = 1; i < pathData.length; i++) {
            let prevTarget = this.targets[i - 1];
            let path = pathData[i];
            let newTarget = new Vector(prevTarget.x + path.x, prevTarget.y + path.y);
            this.targets[i] = newTarget;
        }
        this.currentTarget = this.targets[0];
        this.dir = new Vector(0,0);
        this.speed = 4;
        this.minTargetDist = 2;
    }
    update() {
        if (this.currentTarget == null) return;
        let dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y);
        let distance = (dir.x**2 + dir.y **2) ** (1/2);
        if (distance == 0) return;
        dir.x /= distance;
        dir.y /= distance;
        this.pos.x += dir.x * this.speed;
        this.pos.y += dir.y * this.speed;
        let xDist = Math.abs(this.pos.x - this.currentTarget.x);
        let yDist = Math.abs(this.pos.y - this.currentTarget.y);
        if (xDist <= this.minTargetDist && yDist <= this.minTargetDist){
            this.targets.splice(0,1);
            this.currentTarget = this.targets.length > 0 ? this.targets[0] : null;
        }
    }
 
    render() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
        ctx.fill();
    }
}
 
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
 
var startPos = new Vector(0, 300);
var pathData = [
    new Vector(200, 0),
    new Vector(0, -200),
    new Vector(200, 0),
    new Vector(0, 300),
    new Vector(200, 0),
    new Vector(0, -100),
    new Vector(400, 0),
];
 
let leerlingen = [];
const NUM_leerlingen = 10;
let leerlingStart = new Vector(0, 300);
 
for (let i = 0; i < NUM_leerlingen; i++) {
    let newLeerling = new Leerling(new Vector(leerlingStart.x, leerlingStart.y), "blue", 10, 100, 10);
    leerlingen.push(newLeerling);
    leerlingStart.y -= 30;
}
 
function update() {
    leerlingen.forEach(l => l.update());
}
 
function renderPath() {
    let drawPos = new Vector(startPos.x, startPos.y);
    ctx.fillStyle = "brown";
 
    pathData.forEach(function(path) {
        let x = drawPos.x;
        let y = drawPos.y;
        let w = Math.abs(path.x);
        let h = Math.abs(path.y);
        if (path.x !== 0) {
            ctx.fillRect(x, y - tile, w, tile * 2);
        } else {
            ctx.fillRect(x - tile, y + (path.y > 0 ? 0 : path.y), tile * 2, h);
        }
        drawPos.x += path.x;
        drawPos.y += path.y;
    });
}
 
function renderGrid() {
    ctx.fillStyle = "black";
    let x = 0;
 
    for (let i = 0; i < sw / tile; i++) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, sh);
        ctx.stroke();
        x += tile;
    }
 
    let y = 0;
    for (let i = 0; i < sh / tile; i++) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(sw, y);
        ctx.stroke();
        y += tile;
    }
}
 
function render() {
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, sw, sh);
    renderPath();
    renderGrid();
    leerlingen.forEach(l => l.render());
}
 
function play() {
    update();
    render();
}
 
setInterval(play, 1000 / 60);
 
const towers = [];
let selectedTower = null;
 
class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
    }
 
    draw() {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
 
function placeTower(x, y) {
    if (selectedTower) {
        towers.push(new Tower(x, y));
        drawTowers();
        selectedTower = null;
        document.getElementById('tower1').classList.remove('selected');
    }
}
 
function drawTowers() {
    towers.forEach(tower => tower.draw());
}
 
canvas.addEventListener('click', function(event) {
    if (selectedTower) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        placeTower(mouseX, mouseY);
    }
});
 
document.getElementById('tower1').addEventListener('click', function() {
    selectedTower = 'basicTower';
    document.getElementById('tower1').classList.add('selected');
});
 
// hier komt de coin system te staan
// hier komen de healh bar te staan van het hek 
// hier komt de damage van de docent te staan hoeveel ze aanrichten
// hier komt te staan hoeveel health de leerlingen hebben
// hier komt de damage van de leerlingen
           // hier komt de snelheid van de leerlingen te staan
                // hier komt te staan dat elke ronde ze sterker worden
// hier komt te staan dat je op het docent kan klikken en upgraden docent 1
            // hier komt ook het docent slepen
// hier komt te staan dat je op het docent kan klikken en upgraden docent 2
            // hier komt ook het docent slepen
// hier komt de mini boss 1 te staan die bij wave 10 komt
            // special ability snelheid
// hier komt de mini boss 2 te staan die bij wave 20 komt
            //  special ability stunn
// systeem dat je opnieuw begint als je af bent door op de knop te drukken
// start knop om te beginnen
// waves aangeven
// tijd aangeven
// units places / docenten
// gems 
//  damage done
// starts knop dat je in de game komt en begint 
// knop met login om in je acount te komen
// knop met exit om de game af te sluiten

// hoe gaat het