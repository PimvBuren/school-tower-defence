document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    const sw = canvas.width; // Breedte van het canvas
    const sh = canvas.height; // Hoogte van het canvas
    const tile = 25; // Grootte van het raster
    var bgcolor = "green"; // Achtergrondkleur van het canvas


    const audioObj = new Audio("WHAT.mp3");

    audioObj.play();



    var tijnImg = new Image();
    var alemImg = new Image();
    var milanImg = new Image();
    var ivoImg = new Image();
    var straImg = new Image();
    var antonImg = new Image(); // Anton image for the towers

    let imagesLoaded = 0;  

    function checkImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === 6) { 
            update();
        }
    }

    tijnImg.src = 'img/tijn.png'; 
    alemImg.src = 'img/alem.png'; 
    milanImg.src = 'img/milan.png';
    ivoImg.src = 'img/ivo.png';
    straImg.src = 'img/stra.png';
    antonImg.src = 'img/anton.jpg'; 

    tijnImg.onload = checkImagesLoaded;
    alemImg.onload = checkImagesLoaded;
    milanImg.onload = checkImagesLoaded;
    ivoImg.onload = checkImagesLoaded;
    straImg.onload = checkImagesLoaded;
    antonImg.onload = checkImagesLoaded; 

    const backgroundMusic = new Audio('WHAT.mp3');
    backgroundMusic.loop = true;

    backgroundMusic.play().catch(error => {
        console.error("Playback failed:", error);
    });

    class Vector {
        constructor(x, y) {
            this.x = x; 
            this.y = y; 
        }
    }

    class Leerling {
        constructor(pos, r, health, attack, image) {
            this.pos = pos; 
            this.r = r; 
            this.health = health; 
            this.attack = attack; 
            this.image = image; 
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
            if (this.currentTarget == null) return true; 
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

            const reachThreshold = 10; 
            if (Math.abs(this.pos.x - pathEnd.x) < reachThreshold && Math.abs(this.pos.y - pathEnd.y) < reachThreshold) {
                playerHealth -= this.attack; 
                this.health = 0; 
            }
            return this.health > 0; 
        }

        render() {
            ctx.drawImage(this.image, this.pos.x - this.r, this.pos.y - this.r, 90, 90);
        }
    }

    class Projectile {
        constructor(x, y, target, damage) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.speed = 3; 
        }

        update() {
            let dir = new Vector(this.target.pos.x - this.x, this.target.pos.y - this.y);
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);
            if (distance < 5) {
                this.target.health -= this.damage; 
                return false; 
            }
            dir.x /= distance;
            dir.y /= distance;
            this.x += dir.x * this.speed;
            this.y += dir.y * this.speed;
            return true; 
        }

        render() {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    class Tower {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 20;
            this.range = 150;
            this.attackDamage = 10; 
            this.projectiles = [];
            this.cooldown = 1000; 
            this.lastShotTime = 0; 
        }

        draw() {
            ctx.drawImage(antonImg, this.x - this.radius, this.y - this.radius, 110, 110);
            this.projectiles.forEach((p, index) => {
                if (!p.update()) {
                    this.projectiles.splice(index, 1);
                }
            });
            this.projectiles.forEach(p => p.render());
        }

        shoot(target) {
            const projectile = new Projectile(this.x, this.y, target, this.attackDamage);
            this.projectiles.push(projectile);
        }

        update() {
            let target = null;
            for (let leerling of leerlingen) {
                let dx = leerling.pos.x - this.x;
                let dy = leerling.pos.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.range && leerling.health > 0) { 
                    target = leerling;
                    break;
                }
            }

            const currentTime = Date.now();
            if (target && (currentTime - this.lastShotTime >= this.cooldown)) {
                this.shoot(target);
                this.lastShotTime = currentTime; 
            }
        }
    }

    var startPos = new Vector(0, 625);
    var pathData = [
        new Vector(300, 0),    
        new Vector(0, -200),   
        new Vector(100, 0),    
        new Vector(0, -100),   
        new Vector(200, 0),    
        new Vector(0, 100),    
        new Vector(200, 0),    
        new Vector(0, -300),   
        new Vector(200, 0),    
        new Vector(0, 600),    
        new Vector(200, 0),    
        new Vector(0, -300),   
        new Vector(200, 0),    
        new Vector(0, -300),   
        new Vector(200, 0),    
        new Vector(0, 600),    
        new Vector(300, 0),    
    ];

    let leerlingen = [];
    const NUM_LEERLINGEN = 10; 
    const SPAWN_INTERVAL = 2000; 
    const WAVE_INTERVAL = 100; 
    let playerHealth = 100; 
    let towers = []; 
    let waveActive = false; 

    let currentSpawnIndex = 0; 
    let coins = 0; 

    function spawnLeerling() {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            let leerlingImage;
            if (currentSpawnIndex % 5 === 0) {
                leerlingImage = tijnImg; 
            } else if (currentSpawnIndex % 5 === 1) {
                leerlingImage = alemImg; 
            } else if (currentSpawnIndex % 5 === 2) {
                leerlingImage = milanImg; 
            } else if (currentSpawnIndex % 5 === 3) {
                leerlingImage = straImg; 
            } else if (currentSpawnIndex % 5 === 4) {
                leerlingImage = ivoImg; 
            }

            let leerling = new Leerling(new Vector(startPos.x, startPos.y), 60, 30, 5, leerlingImage);
            leerlingen.push(leerling);
            currentSpawnIndex++;
        }
    }

    var pathEnd = calculatePathEnd();

    function calculatePathEnd() {
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
        }
        return drawPos;
    }

    let towerPlacementActive = false; 
    function placeTower(x, y) {
        if (!towerPlacementActive) return; 
        if (x < 0 || x > sw || y < 0 || y > sh) return; 
        let tower = new Tower(x, y);
        towers.push(tower);
        towerPlacementActive = true; 
    }

    function drawGrid() {
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 0.5;

        for (let x = 0; x < sw; x += tile) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sh);
            ctx.stroke();
        }

        for (let y = 0; y < sh; y += tile) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sw, y);
            ctx.stroke();
        }
    }

    function drawPath() {
        ctx.strokeStyle = "brown";
        ctx.lineWidth = 50;
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
            ctx.lineTo(drawPos.x, drawPos.y);
        }
        ctx.stroke();
    }

    function drawHealthBar() {
        const healthBar = document.getElementById('health');
        healthBar.value = playerHealth; 
        healthBar.style.bottom = `${(100 - playerHealth)}%`; 
    }

    function drawCoins() {
        ctx.fillStyle = "white"; 
        ctx.font = "20px Arial"; 
        ctx.fillText(`Coins: ${coins}`, 10, 30); 
    }

    function update() {
        ctx.clearRect(0, 0, sw, sh);
        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, sw, sh);

        drawGrid();
        drawPath();
        drawHealthBar();
        drawCoins(); 

        towers.forEach(tower => tower.update());
        towers.forEach(tower => tower.draw());

        for (let i = leerlingen.length - 1; i >= 0; i--) {
            if (!leerlingen[i].update()) {
                coins += 5; 
                leerlingen.splice(i, 1); 
            } else {
                leerlingen[i].render();
            }
        }

        if (playerHealth <= 0) {
            playerHealth = 100; 
            leerlingen = []; 
            currentSpawnIndex = 0; 
            return; 
        }

        if (currentSpawnIndex >= NUM_LEERLINGEN && leerlingen.length === 0 && !waveActive) {
            waveActive = true; 
            currentSpawnIndex = 0; 
            setTimeout(() => {
                waveActive = false; 
            }, WAVE_INTERVAL);
        }

        requestAnimationFrame(update);
    }

    canvas.addEventListener('click', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        placeTower(x, y);
    });

    const towerIcon = document.getElementById('tower1');
    towerIcon.addEventListener('click', function() {
        towerPlacementActive = !towerPlacementActive; 
        towerIcon.classList.toggle('selected'); 
    });

    const spawnInterval = setInterval(() => {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            spawnLeerling(); 
        }
    }, SPAWN_INTERVAL); 
});

let playButton = document.getElementById('playButton'); // Assuming you have a button with id 'playButton'

playButton.addEventListener('click', () => {
    backgroundMusic.play().catch(error => {
        console.error("Playback failed:", error);
    });
});