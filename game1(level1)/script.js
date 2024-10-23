document.addEventListener('DOMContentLoaded', function () {
    // Haal het canvas en de context op
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d");

    // Constanten en configuratie
    const TILE_SIZE = 25;  // Grootte van een tegel
    const AUDIO_PATH = "audio/WHAT.mp3";  // Audiopad voor geluid
    const NUM_LEERLINGEN = 10;  // Aantal vijanden per wave
    const SPAWN_INTERVAL = 2000;  // Interval tussen spawns (ms)
    const WAVE_INTERVAL = 100;  // Interval tussen waves (ms)
    let TOWER_COST = 20;  // Kosten voor een toren
    let TOWER_COST_QUINCY = 40;  // Kosten voor Quincy-toren
    let boughtTowers = 0;  // Aantal gekochte torens
    let currentWave = 0;  // Huidige wave nummer

    let playerHealth = 100;  // Gezondheid van de speler
    let coins = 40;  // Start aantal munten
    let currentSpawnIndex = 0;  // Index voor gespawnde vijanden
    let waveActive = false;  // Status of een wave actief is
    let sw, sh;  // Breedte en hoogte van het canvas
    const towers = [];  // Array voor torens
    const leerlingen = [];  // Array voor vijanden (leerlingen)

    // Audio initialiseren
    const audioObj = new Audio(AUDIO_PATH);
    document.addEventListener('click', function () {
        audioObj.play().catch(error => {
            console.log("Fout bij afspelen van audio: ", error);
        });
    }, { once: true });

    // Afbeeldingen laden
    const images = {};
    const imagePaths = {
        tree: 'img/tree.png',
        tijn: 'img/tijn.png',
        alem: 'img/alem.png',
        milan: 'img/milan.png',
        ivo: 'img/ivo.png',
        stra: 'img/stra.png',
        anton: 'img/anton.jpg',
        house: 'img/house.png',
        fence: 'img/fence.png',
        quincy: 'img/quincy.png'
    };
    
    let imagesLoaded = 0;  // Aantal geladen afbeeldingen
    const totalImages = Object.keys(imagePaths).length;  // Totaal aantal afbeeldingen

    // Laadt een afbeelding en telt het aantal geladen afbeeldingen
    const loadImage = (name) => {
        const img = new Image();
        img.src = imagePaths[name];
        img.onload = () => {
            images[name] = img;
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                update();  // Start de update als alle afbeeldingen geladen zijn
            }
        };
    };

    // Voor elke afbeelding in imagePaths, laad de afbeelding
    for (const name in imagePaths) {
        loadImage(name);
    }

    // Vector klasse voor positiebeheer
    class Vector {
        constructor(x, y) {
            this.x = x; 
            this.y = y; 
        }
    }

    // Leerling klasse vertegenwoordigt een vijand
    class Leerling {
        constructor(pos, r, health, attack, image) {
            this.pos = pos;  // Startpositie van de leerling
            this.r = r;  // Radius voor het tekenen
            this.health = health;  // Gezondheid van de leerling
            this.attack = attack;  // Aanvalskracht van de leerling
            this.image = image;  // Afbeelding van de leerling
            this.currentTargetIndex = 0;  // Index van het huidige doel
            this.speed = 2;  // Snelheid van de leerling
            this.minTargetDist = 2;  // Minimale afstand tot het doel
            this.targets = this.calculateTargets();  // Bereken de doelen
            this.currentTarget = this.targets[this.currentTargetIndex];  // Huidig doel
        }

        // Bereken de doelen waar de leerling heen moet
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

        // Update de positie en gezondheid van de leerling
        update() {
            if (!this.currentTarget) return true;  // Geen doel meer

            const dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y);  // Richting naar het doel
            const distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);  // Bereken afstand tot het doel

            // Als de leerling dichtbij het doel is, ga naar het volgende doel
            if (distance < this.minTargetDist) {
                this.currentTargetIndex++;
                this.currentTarget = this.currentTargetIndex < this.targets.length ? this.targets[this.currentTargetIndex] : null;
            } else {
                // Verplaats de leerling richting het doel
                dir.x /= distance;
                dir.y /= distance;
                this.pos.x += dir.x * this.speed;
                this.pos.y += dir.y * this.speed;
            }

            // Controleer of de leerling het einde heeft bereikt en schade toebrengt
            if (this.reachesEnd()) {
                playerHealth -= this.attack;  // Verminder spelergezondheid
                this.health = 0;  // Leerling sterft
            }
            return this.health > 0;  // Controleer of de leerling nog leeft
        }

        // Controleer of de leerling het einde van het pad bereikt
        reachesEnd() {
            const reachThreshold = 10;  // Drempel voor einde
            return Math.abs(this.pos.x - pathEnd.x) < reachThreshold && Math.abs(this.pos.y - pathEnd.y) < reachThreshold;
        }

        // Render de leerling op het canvas
        render() {
            ctx.drawImage(this.image, this.pos.x - this.r, this.pos.y - this.r, 90, 90);
        }
    }

    // Klasse voor projectielen afgeschoten door torens
    class Projectile {
        constructor(x, y, target, damage) {
            this.x = x;  // Start x-positie
            this.y = y;  // Start y-positie
            this.target = target;  // Doelwit van het projectiel
            this.damage = damage;  // Schade van het projectiel
            this.speed = 3;  // Snelheid van het projectiel
        }

        // Update de positie van het projectiel
        update() {
            const dir = new Vector(this.target.pos.x - this.x, this.target.pos.y - this.y);  // Richting naar het doel
            const distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);  // Afstand tot het doel
            if (distance < 5) {  // Als het doel dichtbij is, schade toebrengen
                this.target.health -= this.damage;  // Verminder gezondheid doelwit
                return false;  // Verwijder projectiel
            }
            // Verplaats het projectiel naar het doel
            dir.x /= distance;
            dir.y /= distance;
            this.x += dir.x * this.speed;
            this.y += dir.y * this.speed;
            return true;
        }

        // Render het projectiel op het canvas
        render() {
            ctx.fillStyle = "orange";  // Kleur van het projectiel
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);  // Teken een cirkel
            ctx.fill();
        }
    }

    // Toren klasse vertegenwoordigt verdedigingsstructuren
    class Tower {
        constructor(x, y) {
            this.x = x;  // x-positie van de toren
            this.y = y;  // y-positie van de toren
            this.radius = 20;  // Grootte van de toren
            this.range = 150;  // Bereik van de toren
            this.attackDamage = 10;  // Aanvalsschade
            this.projectiles = [];  // Array voor projectielen
            this.cooldown = 1000;  // Tijd tussen aanvallen (ms)
            this.lastShotTime = 0;  // Laatste tijdstip van aanval
        }

        // Tekent de toren en zijn projectielen
        draw() {
            ctx.drawImage(images.anton, this.x - this.radius, this.y - this.radius, 110, 110);  // Teken de toren
            this.projectiles.forEach((p, index) => {
                if (!p.update()) {  // Als het projectiel zijn doel bereikt heeft
                    this.projectiles.splice(index, 1);  // Verwijder het projectiel
                }
            });
            this.projectiles.forEach(p => p.render());  // Render elk projectiel
        }

        // Vuur een projectiel af naar het doel
        shoot(target) {
            const projectile = new Projectile(this.x, this.y, target, this.attackDamage);  // Maak een nieuw projectiel
            this.projectiles.push(projectile);  // Voeg het projectiel toe aan de array
        }

        // Update de toren, zoek een doelwit en schiet
        update() {
            const target = this.findTarget();  // Zoek een doelwit binnen bereik
            const currentTime = Date.now();
            if (target && (currentTime - this.lastShotTime >= this.cooldown)) {
                this.shoot(target);  // Schiet op het doelwit
                this.lastShotTime = currentTime;  // Reset de tijd voor de volgende aanval
            }
        }

        // Zoek een doelwit binnen bereik
        findTarget() {
            for (let leerling of leerlingen) {
                const dx = leerling.pos.x - this.x;
                const dy = leerling.pos.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);  // Bereken afstand tot de leerling
                if (distance <= this.range && leerling.health > 0) {  // Als de leerling binnen bereik is en leeft
                    return leerling;
                }
            }
            return null;  // Geen doelwit gevonden
        }
    }

    // Klasse voor een andere toren (Quincy)
    class Tower2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 20;
            this.range = 160;
            this.attackDamage = 5;
            this.projectiles = [];
            this.cooldown = 500;
            this.lastShotTime = 0;
        }

        draw() {
            ctx.drawImage(images.quincy, this.x - this.radius + 5, this.y - this.radius, 110, 110);  // Teken Quincy-toren
            this.projectiles.forEach((p, index) => {
                if (!p.update()) {
                    this.projectiles.splice(index, 1);
                }
            });
            this.projectiles.forEach(p => p.render());
        }

        shoot(target) {
            const projectile = new Projectile(this.x + 75, this.y, target, this.attackDamage);
            this.projectiles.push(projectile);
        }

        update() {
            const target = this.findTarget();
            const currentTime = Date.now();
            if (target && (currentTime - this.lastShotTime >= this.cooldown)) {
                this.shoot(target);
                this.lastShotTime = currentTime;
            }
        }

        findTarget() {
            for (let leerling of leerlingen) {
                const dx = leerling.pos.x - this.x;
                const dy = leerling.pos.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.range && leerling.health > 0) {
                    return leerling;
                }
            }
            return null;
        }
    }


    // Startpositie van het pad
    const startPos = new Vector(0, 625);

    // Bewegingen van het pad in segmenten (bochten en rechte stukken)
    const pathData = [
        new Vector(300, 0), new Vector(0, -200), new Vector(100, 0), new Vector(0, -100),
        new Vector(200, 0), new Vector(0, 100), new Vector(200, 0), new Vector(0, -300),
        new Vector(200, 0), new Vector(0, 400), new Vector(200, 0), new Vector(0, -300),
        new Vector(200, 0), new Vector(0, 300), new Vector(200, 0)
    ];

    // Bepaal de eindpositie van het pad door alle bewegingen op te tellen
    let pathEnd = calculatePathEnd();

    function calculatePathEnd() {
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
        }
        return drawPos;  // Retourneer de eindpositie
    }

    // Variabelen voor torenplaatsing
    let towerPlacementActive = false;  // Voor de eerste toren
    let towerPlacementActiveQuincy = false;  // Voor Quincy-toren

    // Functie om een toren te plaatsen op basis van muisklik
    function placeTower(x, y) {
        if (towerPlacementActive) {
            if (x > 0 && x < sw && y > 0 && y < sh) {  // Check of de klik binnen het canvas valt
                if (coins >= TOWER_COST) {
                    // Plaats een gewone toren
                    const tower = new Tower(x, y);
                    towers.push(tower);
                    coins -= TOWER_COST;  // Verminder het aantal munten
                    towerPlacementActive = false;  // Zet plaatsing uit na plaatsen
                    boughtTowers++;
                    let calc = boughtTowers * 7;
                    TOWER_COST = Math.round(TOWER_COST + calc);  // Verhoog de kosten voor de volgende toren
                    document.getElementById('antonPrice').innerHTML = TOWER_COST;
                } else {
                    alert("Niet genoeg munten om een toren te plaatsen!");  // Toon waarschuwing bij te weinig munten
                }
            }
        }

        if (towerPlacementActiveQuincy) {
            if (x > 0 && x < sw && y > 0 && y < sh) {
                if (coins >= TOWER_COST_QUINCY) {
                    // Plaats een Quincy-toren
                    const tower = new Tower2(x, y);
                    towers.push(tower);
                    coins -= TOWER_COST_QUINCY;
                    towerPlacementActiveQuincy = false;
                    boughtTowers++;
                    let calc = boughtTowers * 7;
                    TOWER_COST_QUINCY = Math.round(TOWER_COST_QUINCY + calc);
                    document.getElementById('quincyPrice').innerHTML = TOWER_COST_QUINCY;
                } else {
                    alert("Niet genoeg munten om een Quincy-toren te plaatsen!");
                }
            }
        }
    }

    // Functie om het raster op het canvas te tekenen
    function drawGrid() {
        ctx.strokeStyle = "lightgray";  // Kleur van de rasterlijnen
        ctx.lineWidth = 0.5;  // Lijnbreedte
        for (let x = 0; x < sw; x += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sh);
            ctx.stroke();
        }
        for (let y = 0; y < sh; y += TILE_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sw, y);
            ctx.stroke();
        }
    }

    // Functie om het pad te tekenen dat de vijanden volgen
    function drawPath() {
        ctx.strokeStyle = "brown";  // Kleur van het pad
        ctx.lineWidth = 50;  // Dikte van het pad
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);  // Begin bij de startpositie
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
            ctx.lineTo(drawPos.x, drawPos.y);
        }
        ctx.stroke();  // Teken het pad
    }

    // Functie om het huis en het hek aan het einde van het pad te tekenen
    function drawHouseAndFence() {
        ctx.drawImage(images.house, startPos.x, startPos.y - 100, 120, 120);  // Huis aan het begin
        ctx.drawImage(images.fence, pathEnd.x - 100, pathEnd.y - 100, 120, 120);  // Hek aan het einde
    }

    // Functie om de gezondheidsbalk te tekenen
    function drawHealthBar() {
        const healthBar = document.getElementById('health');
        healthBar.value = playerHealth;  // Stel de waarde van de balk in op de huidige gezondheid
    }

    // Functie om het aantal munten en de huidige golf weer te geven
    function drawCoins() {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`Coins: ${coins}`, 10, 30);  // Weergeven van munten
        ctx.fillText(`Current wave: ${currentWave}`, 10, 50);  // Weergeven van de golf
    }

    // Update-functie om het spel bij te werken
    function update() {
        ctx.clearRect(0, 0, sw, sh);  // Wis het canvas
        ctx.fillStyle = "darkgreen";
        ctx.fillRect(0, 0, sw, sh);  // Teken de achtergrond

        drawGrid();  // Teken het raster
        drawPath();  // Teken het pad
        drawHouseAndFence();  // Teken huis en hek
        drawHealthBar();  // Teken de gezondheidsbalk
        drawCoins();  // Teken de munten en golfstatus

        towers.forEach(tower => tower.update());  // Update elke toren
        towers.forEach(tower => tower.draw());  // Teken elke toren

        // Update de vijanden (leerlingen)
        for (let i = leerlingen.length - 1; i >= 0; i--) {
            if (!leerlingen[i].update()) {
                coins += Math.floor(Math.random() * 10);  // Voeg munten toe bij het doden van een vijand
                leerlingen.splice(i, 1);  // Verwijder vijand als deze dood is
            } else {
                leerlingen[i].render();  // Teken de vijand
            }
        }

        // Controleer of de speler dood is
        if (playerHealth <= 0) {
            window.location.href = 'eindscherm.html';  // Ga naar het eindscherm
            return;
        }

        // Nieuwe golf als alle vijanden dood zijn
        if (currentSpawnIndex >= NUM_LEERLINGEN && leerlingen.length === 0 && !waveActive) {
            waveActive = true;
            currentSpawnIndex = 0;
            setTimeout(() => {
                waveActive = false;  // Reset na de golf
            }, WAVE_INTERVAL);
        }

        requestAnimationFrame(update);  // Vraag om de volgende frame-update
    }

    // Event listeners voor de canvas-klik
    canvas.addEventListener('click', function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        placeTower(x, y);  // Plaats toren op de klikpositie
    });

    // Event listeners voor de torenknoppen
    const towerIcon = document.getElementById('tower1');
    towerIcon.addEventListener('click', function () {
        towerPlacementActive = !towerPlacementActive;
        towerIcon.classList.toggle('selected');  // Schakel selectie van de eerste toren
    });

    const towerIcon2 = document.getElementById('tower2');
    towerIcon2.addEventListener('click', function () {
        towerPlacementActiveQuincy = true;
        towerIcon2.classList.toggle('selected');  // Schakel selectie van Quincy-toren
    });

    // Interval om vijanden te spawnen
    const spawnInterval = setInterval(() => {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            spawnLeerling();  // Spawn een vijand (leerling)
            if (currentSpawnIndex === 1) {
                currentWave++;  // Verhoog het golfnummer
            }
        }
    }, SPAWN_INTERVAL);

    // Functie om vijanden te spawnen
    function spawnLeerling() {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            const leerlingImage = images[getLeerlingImage(currentSpawnIndex)];
            const leerling = new Leerling(new Vector(startPos.x, startPos.y), 60, 30 * currentWave / 1.5, 5, leerlingImage);
            leerlingen.push(leerling);  // Voeg de vijand toe aan de array
            currentSpawnIndex++;
        }
    }

    // Functie om een willekeurige leerlingafbeelding te krijgen
    function getLeerlingImage(index) {
        const imagesList = ['tijn', 'alem', 'milan', 'stra', 'ivo'];  // Lijst van leerlingafbeeldingen
        return imagesList[index % 5];  // Retourneer een afbeelding op basis van de index
    }

    // Functie om het canvas te schalen bij venstergrootte
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        sw = canvas.width;
        sh = canvas.height;
        pathEnd = calculatePathEnd();  // Herbereken het einde van het pad
    }

    // Event listener om het canvas te schalen bij venstergrootte
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();  // Roep de functie direct aan om het canvas op te schalen
});