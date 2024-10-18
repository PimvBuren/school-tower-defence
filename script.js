var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
const sw = canvas.width;
const sh = canvas.height;
const tile = 25;
var bgcolor = "green";

var leerlingImg1 = new Image();
leerlingImg1.src = '1729083142124.png';
leerlingImg1.onload = () => console.log("Image 1 loaded successfully");
leerlingImg1.onerror = () => console.error("Failed to load Image 1");

var leerlingImg2 = new Image();
leerlingImg2.src = '1729083160198.png';
leerlingImg2.onload = () => console.log("Image 2 loaded successfully");
leerlingImg2.onerror = () => console.error("Failed to load Image 2");

class Leerling {
    constructor(pos, img, r, health, attack) {
        this.pos = pos;
        this.img = img;
        this.r = r;
        this.health = health;
        this.attack = attack;
        this.currentTargetIndex = 0;
        this.speed = 2;
        this.minTargetDist = 2;
        this.targets = this.calculateTargets();
        this.currentTarget = this.targets[this.currentTargetIndex];
    }

    calculateTargets() {
        let targets = [];
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
            targets.push(new Vector(drawPos.x, drawPos.y));
        }
        return targets;
    }

    update() {
        if (this.currentTarget == null) return;
        let dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y);
        let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);
        if (distance < this.minTargetDist) {
            this.currentTargetIndex++;
            this.currentTarget = this.currentTargetIndex < this.targets.length ? this.targets[this.currentTargetIndex] : null;
        } else {
            dir.x /= distance;
            dir.y /= distance;
            this.pos.x += dir.x * this.speed;
            this.pos.y += dir.y * this.speed;
        }
    }

    render() {
        if (this.img.complete && this.img.naturalWidth > 0) {
            ctx.drawImage(this.img, this.pos.x - this.r, this.pos.y - this.r, this.r * 2, this.r * 2);
        } else {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

var startPos = new Vector(0, 625);
var pathData = [
    new Vector(200, 0),
    new Vector(0, -400),
    new Vector(400, 0),
    new Vector(0, 300),
    new Vector(200, 0),
    new Vector(0, -100),
    new Vector(400, 0),
];

let leerlingen = [];
const NUM_leerlingen = 100;

function spawnLeerlingen() {
    for (let i = 0; i < NUM_leerlingen; i++) {
        setTimeout(() => {
            let randomImg = Math.random() < 0.5 ? leerlingImg1 : leerlingImg2;
            let newLeerling = new Leerling(new Vector(startPos.x, startPos.y), randomImg, 60, 100, 10);
            leerlingen.push(newLeerling);
        }, i * 1000);
    }
}

spawnLeerlingen();

function update() {
    leerlingen.forEach(l => l.update());
}

function renderPath() {
    let drawPos = new Vector(startPos.x, startPos.y);
    ctx.fillStyle = "brown";
    
    pathData.forEach((path, index) => {
        let x = drawPos.x;
        let y = drawPos.y;
        let w = Math.abs(path.x);
        let h = Math.abs(path.y);
        
        if (path.x !== 0) {
            ctx.fillRect(x, y - tile, w, tile * 2);
        } else {
            ctx.fillRect(x - tile, y + (path.y > 0 ? 0 : path.y), tile * 2, h);
        }

        ctx.fillRect(x - tile, y - tile, tile * 2, tile * 2);
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
// hier komt te staan dat je op het docent kan klikken en upgradeßßn docent 2
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

