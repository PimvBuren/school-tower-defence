document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    const sw = canvas.width; // Breedte van het canvas
    const sh = canvas.height; // Hoogte van het canvas
    const tile = 25; // Grootte van het raster
    var bgcolor = "green"; // Achtergrondkleur van het canvas

    // Afbeeldingen voor leerlingen
    var tijnImg = new Image();
    var alemImg = new Image();
    var milanImg = new Image();
    var ivoImg = new Image();
    var straImg = new Image();

    let imagesLoaded = 0;  // Teller om bij te houden of alle afbeeldingen zijn geladen

    // Controleer of alle afbeeldingen zijn geladen
    function checkImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === 5) { // Aantal afbeeldingen
            // Alle afbeeldingen zijn geladen, start nu de game-logica
            update();
        }
    }

    // Stel de bron van de afbeeldingen in
    tijnImg.src = 'img/tijn.png'; 
    alemImg.src = 'img/alem.png'; 
    milanImg.src = 'img/milan.png';
    ivoImg.src = 'img/ivo.png';
    straImg.src = 'img/stra.png';

    // Voeg een onload-eventlistener toe voor elke afbeelding
    tijnImg.onload = checkImagesLoaded;
    alemImg.onload = checkImagesLoaded;
    milanImg.onload = checkImagesLoaded;
    ivoImg.onload = checkImagesLoaded;
    straImg.onload = checkImagesLoaded;

    // Klassen definities
    class Vector {
        constructor(x, y) {
            this.x = x; // x-coördinaat
            this.y = y; // y-coördinaat
        }
    }

    class Leerling {
        constructor(pos, r, health, attack, image) {
            this.pos = pos; // Positie van de leerling
            this.r = r; // Straal van de leerling
            this.health = health; // Gezondheid van de leerling
            this.attack = attack; // Aanvalssterkte van de leerling
            this.image = image; // Afbeelding van de leerling
            this.currentTargetIndex = 0; // Index van het huidige doelwit
            this.speed = 2; // Snelheid van de leerling
            this.minTargetDist = 2; // Minimale afstand tot het doelwit
            this.targets = this.calculateTargets(); // Bereken doelwitten
            this.currentTarget = this.targets[this.currentTargetIndex]; // Huidige doelwit
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
            if (this.currentTarget == null) return true; // Stop als er geen doelwit is
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

            // Verminder gezondheid van de speler als het einde van het pad wordt bereikt
            const reachThreshold = 10; // Drempelafstand voor het bereiken van het einde van het pad
            if (Math.abs(this.pos.x - pathEnd.x) < reachThreshold && Math.abs(this.pos.y - pathEnd.y) < reachThreshold) {
                playerHealth -= this.attack; // Verminder de gezondheid van de speler
                this.health = 0; // Markeer de leerling als verslagen
            }
            return this.health > 0; // Controleer of de leerling nog leeft
        }

        render() {
            ctx.drawImage(this.image, this.pos.x - this.r, this.pos.y - this.r, this.r * 2, this.r * 2);
        }
    }

    class Projectile {
        constructor(x, y, target, damage) {
            this.x = x;
            this.y = y;
            this.target = target;
            this.damage = damage;
            this.speed = 5; // Snelheid van het projectiel
        }

        update() {
            let dir = new Vector(this.target.pos.x - this.x, this.target.pos.y - this.y);
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);
            if (distance < 5) {
                this.target.health -= this.damage; // Verminder gezondheid van het doelwit
                return false; // Verwijder projectiel
            }
            dir.x /= distance;
            dir.y /= distance;
            this.x += dir.x * this.speed;
            this.y += dir.y * this.speed;
            return true; // Houd projectiel actief
        }

        render() {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
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
            this.cooldown = 1000; // Herlaadtijd in milliseconden (1 seconde)
            this.lastShotTime = 0; // Tijd van de laatste schot
        }

        draw() {
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Update en render projectielen
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
                if (distance <= this.range && leerling.health > 0) { // Controleer of het doelwit leeft
                    target = leerling;
                    break;
                }
            }

            const currentTime = Date.now();
            if (target && (currentTime - this.lastShotTime >= this.cooldown)) {
                this.shoot(target);
                this.lastShotTime = currentTime; // Reset de tijd van de laatste schot
            }
        }
    }

    // Startpositie van de leerlingen
    var startPos = new Vector(0, 625);
    var pathData = [
        new Vector(300, 0),    // Beweeg naar rechts
        new Vector(0, -200),   // Beweeg omhoog
        new Vector(100, 0),    // Beweeg naar rechts
        new Vector(0, -100),   // Beweeg omhoog
        new Vector(200, 0),    // Beweeg naar rechts
        new Vector(0, 100),    // Beweeg naar beneden
        new Vector(200, 0),    // Beweeg naar rechts
        new Vector(0, -300),   // Beweeg omhoog
        new Vector(200, 0),    // Beweeg naar rechts
        new Vector(0, 600),    // Beweeg naar beneden
        new Vector(200, 0),    // Beweeg naar rechts
        new Vector(0, -300),   // Beweeg omhoog
        new Vector(200, 0),    // Beweeg naar rechts 
        new Vector(0, -300),   // Beweeg omhoog 
        new Vector(200, 0),    // Beweeg naar rechts 
        new Vector(0, 600),    // Beweeg naar beneden
        new Vector(300, 0),    // Beweeg naar rechts 
    ];

    let leerlingen = [];
    const NUM_LEERLINGEN = 10; // Totaal aantal leerlingen om te spawnen
    const SPAWN_INTERVAL = 2000; // Interval voor spawnen in milliseconden (2 seconden)
    const WAVE_INTERVAL = 100; // Interval tussen golven in milliseconden
    let playerHealth = 100; // Gezondheid van de speler
    let towers = []; // Array voor torens
    let waveActive = false; // Vlag om bij te houden of een golf actief is

    let currentSpawnIndex = 0; // Houdt bij welke leerling we momenteel spawnen

    function spawnLeerling() {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            // Kies een leerling afbeelding op basis van de huidige index
            let leerlingImage;
            if (currentSpawnIndex % 5 === 0) {
                leerlingImage = tijnImg; // Tijn
            } else if (currentSpawnIndex % 5 === 1) {
                leerlingImage = alemImg; // Alem
            } else if (currentSpawnIndex % 5 === 2) {
                leerlingImage = milanImg; // Milan
            } else if (currentSpawnIndex % 5 === 3) {
                leerlingImage = straImg; // Stra
            } else if (currentSpawnIndex % 5 === 4) {
                leerlingImage = ivoImg; // Ivo
            }

            // Maak een nieuwe leerling aan
            let leerling = new Leerling(new Vector(startPos.x, startPos.y), 60, 30, 5, leerlingImage);
            leerlingen.push(leerling);
            currentSpawnIndex++; // Verhoog het spawn-aantal
        }
    }

    // Dynamisch berekenen van de eindpositie van het pad
    var pathEnd = calculatePathEnd();

    function calculatePathEnd() {
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
        }
        return drawPos; // Geef de eindpositie terug
    }

    // Methode om een toren te plaatsen
    let towerPlacementActive = false; // Toggle voor torenplaatsing
    function placeTower(x, y) {
        if (!towerPlacementActive) return; // Niet plaatsen als niet actief
        if (x < 0 || x > sw || y < 0 || y > sh) return; // Zorg ervoor dat de toren binnen het canvas blijft
        let tower = new Tower(x, y);
        towers.push(tower);
        towerPlacementActive = true; // Zet de torenplaatsing inactief
    }

    // Rastertekenmethode
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

    // Padtekenmethode
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

    // Gezondheidsbalk tekenen
    function drawHealthBar() {
        const healthBar = document.getElementById('health');
        healthBar.value = playerHealth; // Update de waarde van de gezondheidsbalk
        healthBar.style.bottom = `${(100 - playerHealth)}%`; // Verander de positie van de gezondheidsbalk
    }

    // Hoofdupdate-lus
    function update() {
        ctx.clearRect(0, 0, sw, sh);
        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, sw, sh);

        drawGrid();
        drawPath();
        drawHealthBar(); // Teken de gezondheidbalk
        towers.forEach(tower => tower.update());
        towers.forEach(tower => tower.draw());

        // Loop over leerlingen van achteren naar voren
        for (let i = leerlingen.length - 1; i >= 0; i--) {
            if (!leerlingen[i].update()) {
                leerlingen.splice(i, 1); // Verwijder leerling als deze dood is
            } else {
                leerlingen[i].render();
            }
        }

        // Einde van het spel als de gezondheid van de speler nul of minder is
        if (playerHealth <= 0) {
            playerHealth = 100; // Reset de gezondheid van de speler
            leerlingen = []; // Reset leerlingen
            currentSpawnIndex = 0; // Reset het spawn-aantal
            return; // Stop de update loop om niet verder te gaan
        }

        // Check of we alle leerlingen hebben verslagen
        if (currentSpawnIndex >= NUM_LEERLINGEN && leerlingen.length === 0 && !waveActive) {
            waveActive = true; // Markeer dat de golf actief is
            currentSpawnIndex = 0; // Reset het spawn-aantal voor de nieuwe golf
            setTimeout(() => {
                waveActive = false; // Reset de golf-actief vlag
            }, WAVE_INTERVAL);
        }

        requestAnimationFrame(update); // Vraag de volgende frame aan
    }

    // Voeg een klik-gebeurtenislistener toe voor het plaatsen van torens
    canvas.addEventListener('click', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        placeTower(x, y);
    });

    // Voeg een klik-gebeurtenislistener toe voor de torenicon
    const towerIcon = document.getElementById('tower1');
    towerIcon.addEventListener('click', function() {
        towerPlacementActive = !towerPlacementActive; // Toggle de torenplaatsing
        towerIcon.classList.toggle('selected'); // Visuele indicatie
    });

    // Start de spawn interval voor leerlingen
    const spawnInterval = setInterval(() => {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            spawnLeerling(); // Spawn een leerling
        }
    }, SPAWN_INTERVAL); // Spawn elke 2 seconden
});
