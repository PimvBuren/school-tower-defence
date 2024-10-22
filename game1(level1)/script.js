document.addEventListener('DOMContentLoaded', function () {
    // Haal het canvas element op en de context voor tekenen
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");
    
    const tile = 25; // Grootte van de rastertegel
    var bgcolor = "green"; // Achtergrondkleur van het canvas
    
    // Maak een audio-object aan en speel een geluid af
    const audioObj = new Audio("WHAT.mp3");
    audioObj.play();

    // Laad afbeeldingen voor de leerlingen en torens
    var tijnImg = new Image();
    var alemImg = new Image();
    var milanImg = new Image();
    var ivoImg = new Image();
    var straImg = new Image();
    var antonImg = new Image(); 

    let imagesLoaded = 0;  // Houdt bij hoeveel afbeeldingen zijn geladen

    // Controleert of alle afbeeldingen zijn geladen
    function checkImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === 6) { // Als alle 6 afbeeldingen zijn geladen, start de update functie
            update();
        }
    }

    // Stel de bron van de afbeeldingen in
    tijnImg.src = 'img/tijn.png'; 
    alemImg.src = 'img/alem.png'; 
    milanImg.src = 'img/milan.png';
    ivoImg.src = 'img/ivo.png';
    straImg.src = 'img/stra.png';
    antonImg.src = 'img/anton.jpg'; 

    // Wanneer de afbeeldingen zijn geladen, roep checkImagesLoaded aan
    tijnImg.onload = checkImagesLoaded;
    alemImg.onload = checkImagesLoaded;
    milanImg.onload = checkImagesLoaded;
    ivoImg.onload = checkImagesLoaded;
    straImg.onload = checkImagesLoaded;
    antonImg.onload = checkImagesLoaded; 

    // Definieert een vector klasse voor posities
    class Vector {
        constructor(x, y) {
            this.x = x; 
            this.y = y; 
        }
    }

    // Definieert een Leerling klasse
    class Leerling {
        constructor(pos, r, health, attack, image) {
            this.pos = pos; // Huidige positie van de leerling
            this.r = r; // Radiüs of grootte van de leerling
            this.health = health; // Gezondheid van de leerling
            this.attack = attack; // Aanvalskracht van de leerling
            this.image = image; // Afbeelding van de leerling
            this.currentTargetIndex = 0; // Huidig doelindex in het pad
            this.speed = 2; // Snelheid van de leerling
            this.minTargetDist = 2; // Minimale afstand tot het doel
            this.targets = this.calculateTargets(); // Berekent de doelposities langs het pad
            this.currentTarget = this.targets[this.currentTargetIndex]; // Huidig doel
        }

        // Berekent de doelposities die de leerling zal volgen
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

        // Update de positie van de leerling en controleert of deze nog leeft
        update() {
            if (this.currentTarget == null) return true; // Als er geen doel meer is, blijft de leerling leven
            
            // Bereken richting naar het doel
            let dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y);
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2); // Bereken de afstand tot het doel
            
            // Als de leerling dicht bij het doel is, ga naar het volgende doel
            if (distance < this.minTargetDist) {
                this.currentTargetIndex++;
                this.currentTarget = this.currentTargetIndex < this.targets.length ? this.targets[this.currentTargetIndex] : null;
            } else {
                // Normaliseer de richting en verplaats de leerling
                dir.x /= distance;
                dir.y /= distance;
                this.pos.x += dir.x * this.speed;
                this.pos.y += dir.y * this.speed;
            }

            const reachThreshold = 10; // Drempelwaarde om te controleren of de leerling de eindpositie heeft bereikt
            // Als de leerling het einddoel heeft bereikt, verliest de speler gezondheid
            if (Math.abs(this.pos.x - pathEnd.x) < reachThreshold && Math.abs(this.pos.y - pathEnd.y) < reachThreshold) {
                playerHealth -= this.attack; // Verminder de gezondheid van de speler
                this.health = 0; // Zet de gezondheid van de leerling op 0
            }
            return this.health > 0; // Geeft terug of de leerling nog leeft
        }

        // Render de leerling op het canvas
        render() {
            ctx.drawImage(this.image, this.pos.x - this.r, this.pos.y - this.r, 90, 90);
        }
    }

    // Definieert een Projectile klasse voor projectielen van torens
    class Projectile {
        constructor(x, y, target, damage) {
            this.x = x; // Huidige x-positie van het projectiel
            this.y = y; // Huidige y-positie van het projectiel
            this.target = target; // Doel waar het projectiel naartoe gaat
            this.damage = damage; // Schade die het projectiel doet
            this.speed = 3; // Snelheid van het projectiel
        }

        // Update de positie van het projectiel
        update() {
            let dir = new Vector(this.target.pos.x - this.x, this.target.pos.y - this.y);
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2);
            // Als het projectiel dichtbij het doel is, doe schade
            if (distance < 5) {
                this.target.health -= this.damage; // Verminder de gezondheid van het doel
                return false; // Projectiel moet worden verwijderd
            }
            // Normaliseer de richting en verplaats het projectiel
            dir.x /= distance;
            dir.y /= distance;
            this.x += dir.x * this.speed;
            this.y += dir.y * this.speed;
            return true; // Projectiel leeft nog
        }

        // Render het projectiel op het canvas
        render() {
            ctx.fillStyle = "orange";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Definieert een Tower klasse
    class Tower {
        constructor(x, y) {
            this.x = x; // X-positie van de toren
            this.y = y; // Y-positie van de toren
            this.radius = 20; // Radius van de toren
            this.range = 150; // Bereik van de toren
            this.attackDamage = 10; // Schade die de toren doet
            this.projectiles = []; // Lijst van projectielen die door de toren zijn geschoten
            this.cooldown = 1000; // Herlaadtijd tussen schoten in milliseconden
            this.lastShotTime = 0; // Tijd van de laatste schot
        }

        // Teken de toren en zijn projectielen
        draw() {
            ctx.drawImage(antonImg, this.x - this.radius, this.y - this.radius, 110, 110);
            this.projectiles.forEach((p, index) => {
                if (!p.update()) { // Update projectiel en verwijder indien nodig
                    this.projectiles.splice(index, 1);
                }
            });
            this.projectiles.forEach(p => p.render()); // Render projectielen
        }

        // Schiet een projectiel naar het doel
        shoot(target) {
            const projectile = new Projectile(this.x, this.y, target, this.attackDamage);
            this.projectiles.push(projectile);
        }

        // Update de toren om te controleren of hij kan schieten
        update() {
            let target = null; // Begin met geen doel
            // Zoek naar een leerling binnen het bereik van de toren
            for (let leerling of leerlingen) {
                let dx = leerling.pos.x - this.x;
                let dy = leerling.pos.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= this.range && leerling.health > 0) { 
                    target = leerling; // Stel het doel in als een leerling binnen bereik is
                    break;
                }
            }

            const currentTime = Date.now(); // Huidige tijd
            // Als er een doel is en de toren kan schieten, schiet het
            if (target && (currentTime - this.lastShotTime >= this.cooldown)) {
                this.shoot(target);
                this.lastShotTime = currentTime; // Werk de tijd van de laatste schot bij
            }
        }
    }

    var startPos = new Vector(0, 625); // Beginpositie voor leerlingen
    var pathData = [ // Paden die de leerlingen zullen volgen
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

    let leerlingen = []; // Lijst van leerlingen die spawnen
    const NUM_LEERLINGEN = 10; // Totaal aantal leerlingen dat zal spawnen
    const SPAWN_INTERVAL = 2000; // Interval tussen spawns in milliseconden
    const WAVE_INTERVAL = 100; // Interval tussen golven
    let playerHealth = 100; // Gezondheid van de speler
    let towers = []; // Lijst van torens die zijn geplaatst
    let waveActive = false; // Of er momenteel een golf actief is

    let currentSpawnIndex = 0; // Huidige index voor het spawnen van leerlingen
    let coins = 0; // Aantal verzamelde munten

    // Spawn een nieuwe leerling als dat mogelijk is
    function spawnLeerling() {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            let leerlingImage;
            // Bepaal welke afbeelding te gebruiken op basis van de huidige index
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

            // Maak een nieuwe leerling aan en voeg deze toe aan de lijst
            let leerling = new Leerling(new Vector(startPos.x, startPos.y), 60, 30, 5, leerlingImage);
            leerlingen.push(leerling);
            currentSpawnIndex++;
        }
    }

    var pathEnd = calculatePathEnd(); // Bereken de eindpositie van het pad

    // Bereken de eindpositie van het pad
    function calculatePathEnd() {
        let drawPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            drawPos.x += path.x;
            drawPos.y += path.y;
        }
        return drawPos; // Geef de eindpositie terug
    }

    let towerPlacementActive = false; // Controleert of het plaatsen van torens actief is
    // Plaats een toren op de gespecificeerde locatie
    function placeTower(x, y) {
        if (!towerPlacementActive) return; // Als het plaatsen van torens niet actief is, doe niets
        if (x < 0 || x > sw || y < 0 || y > sh) return; // Controleer of de coördinaten binnen het canvas vallen
        let tower = new Tower(x, y); // Maak een nieuwe toren aan
        towers.push(tower); // Voeg de toren toe aan de lijst
        towerPlacementActive = true; // Zet het plaatsen van torens aan
    }

    // Teken het raster op het canvas
    function drawGrid() {
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 0.5;

        // Teken verticale lijnen
        for (let x = 0; x < sw; x += tile) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, sh);
            ctx.stroke();
        }

        // Teken horizontale lijnen
        for (let y = 0; y < sh; y += tile) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(sw, y);
            ctx.stroke();
        }
    }

    // Teken het pad dat de leerlingen volgen
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
        ctx.stroke(); // Voer de stroke uit om het pad te tekenen
    }

    // Teken de gezondheidsbalk van de speler
    function drawHealthBar() {
        const healthBar = document.getElementById('health');
        healthBar.value = playerHealth; // Stel de waarde van de gezondheidsbalk in
        healthBar.style.bottom = `${(100 - playerHealth)}%`; // Positioneer de gezondheidsbalk op basis van de gezondheid
    }

    // Teken het aantal verzamelde munten
    function drawCoins() {
        ctx.fillStyle = "white"; 
        ctx.font = "20px Arial"; 
        ctx.fillText(`Coins: ${coins}`, 10, 30); // Toon het aantal munten op het canvas
    }

    // Update het canvas elke frame
    function update() {
        ctx.clearRect(0, 0, sw, sh); // Maak het canvas schoon
        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, sw, sh); // Vul het canvas met de achtergrondkleur

        drawGrid(); // Teken het raster
        drawPath(); // Teken het pad
        drawHealthBar(); // Teken de gezondheidsbalk
        drawCoins(); // Teken het aantal munten

        // Update en teken alle torens
        towers.forEach(tower => tower.update());
        towers.forEach(tower => tower.draw());

        // Update en teken alle leerlingen
        for (let i = leerlingen.length - 1; i >= 0; i--) {
            if (!leerlingen[i].update()) {
                coins += 5; // Verhoog het aantal munten bij het bereiken van de speler
                leerlingen.splice(i, 1); // Verwijder de leerling van de lijst
            } else {
                leerlingen[i].render(); // Render de leerling
            }
        }

        // Controleer of de gezondheid van de speler op is
        if (playerHealth <= 0) {
            playerHealth = 100; // Reset de gezondheid van de speler
            leerlingen = []; // Verwijder alle leerlingen
            currentSpawnIndex = 0; // Reset de spawnindex
            return; 
        }

        // Controleer of er een golf van leerlingen klaar is om te spawnen
        if (currentSpawnIndex >= NUM_LEERLINGEN && leerlingen.length === 0 && !waveActive) {
            waveActive = true; 
            currentSpawnIndex = 0; 
            setTimeout(() => {
                waveActive = false; // Zet golf terug naar niet actief na de interval
            }, WAVE_INTERVAL);
        }

        requestAnimationFrame(update); // Vraag de volgende frame-update aan
    }

    // Plaats een toren wanneer er op het canvas wordt geklikt
    canvas.addEventListener('click', function(event) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        placeTower(x, y);
    });

    // Beheer de torenplaatsing met een knop
    const towerIcon = document.getElementById('tower1');
    towerIcon.addEventListener('click', function() {
        towerPlacementActive = !towerPlacementActive; // Toggle de torenplaatsing
        towerIcon.classList.toggle('selected'); // Voeg een klasse toe voor visuele feedback
    });

    // Spawn leerlingen op interval
    const spawnInterval = setInterval(() => {
        if (currentSpawnIndex < NUM_LEERLINGEN) {
            spawnLeerling(); // Spawn een leerling
        }
    }, SPAWN_INTERVAL); 

    // Functie om het canvas opnieuw te schalen
    function resizeCanvas() {
        canvas.width = window.innerWidth; // Stel de breedte in op de breedte van het venster
        canvas.height = window.innerHeight; // Stel de hoogte in op de hoogte van het venster
        sw = canvas.width; // Update de schermbreedte
        sh = canvas.height; // Update de schermhoogte
        pathEnd = calculatePathEnd(); // Herbereken het pad eind op schaling
    }

    window.addEventListener('resize', resizeCanvas); // Voeg een event listener toe voor venster schaling
    resizeCanvas(); // Eerste aanroep om de canvasgrootte in te stellen
});
