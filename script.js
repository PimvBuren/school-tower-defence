document.addEventListener('DOMContentLoaded', function () {
    // Selecteert het canvas-element uit de HTML en haalt de 2D-context op, waarmee we kunnen tekenen op de canvas.
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    // Definieert de breedte en hoogte van de canvas en stelt een tegelgrootte en achtergrondkleur in.
    const sw = canvas.width;
    const sh = canvas.height;
    const tile = 25;
    var bgcolor = "green";

    // Zet een tekst op de canvas om "wave 1" weer te geven.
    ctx.font = "50px Arial";
    ctx.fillText("wave 1", 300, 800);

    // Een simpele klasse om vectoren te definiëren met een x- en y-coördinaat.
    class Vector {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    // De 'Leerling' klasse representeert een vijandelijke eenheid in het spel.
    class Leerling {
        constructor(pos, r, health, attack) {
            this.pos = pos; // Startpositie van de leerling.
            this.r = r; // Radius (grootte) van de leerling.
            this.health = health; // Gezondheid van de leerling.
            this.attack = attack; // Aanvalsschade van de leerling.
            this.currentTargetIndex = 0; // Index van het huidige doel in het pad.
            this.speed = 2; // Snelheid waarmee de leerling beweegt.
            this.minTargetDist = 2; // Minimale afstand tot een doel voordat de leerling naar het volgende doel gaat.
            this.targets = this.calculateTargets(); // Berekent de doelen langs het pad.
            this.currentTarget = this.targets[this.currentTargetIndex]; // Het eerste doel.
        }

        // Berekent de doelen langs het pad die de leerling zal volgen.
        calculateTargets() {
            let targets = [];
            let drawPos = new Vector(startPos.x, startPos.y); // Beginpositie van de leerling.
            for (let path of pathData) {
                drawPos.x += path.x;
                drawPos.y += path.y;
                targets.push(new Vector(drawPos.x, drawPos.y)); // Elk segment van het pad voegt een doel toe.
            }
            return targets;
        }

        // Update de positie van de leerling door het huidige doel te volgen.
        update() {
            if (this.currentTarget == null) return; // Geen doel meer, dus stop.
            let dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y); // Richting naar het doel.
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2); // Afstand tot het doel.
            if (distance < this.minTargetDist) {
                this.currentTargetIndex++; // Ga naar het volgende doel als we dichtbij genoeg zijn.
                this.currentTarget = this.currentTargetIndex < this.targets.length ? this.targets[this.currentTargetIndex] : null;
            } else {
                dir.x /= distance;
                dir.y /= distance;
                this.pos.x += dir.x * this.speed; // Beweeg in de richting van het doel.
                this.pos.y += dir.y * this.speed;
            }
            if (this.pos.x >= pathEnd.x && this.pos.y >= pathEnd.y) {
                enemyHealth -= this.attack; // Verminder de gezondheid van de vijand wanneer het eind van het pad wordt bereikt.
                this.health = 10; // Herstel de gezondheid van de leerling.
            }
        }

        // Tekent de leerling op de canvas.
        render() {
            ctx.fillStyle = "blue";
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Startpositie van de leerlingen op het canvas.
    var startPos = new Vector(0, 625);

    // Definieert het pad dat de leerlingen zullen volgen met een reeks vectoren.
    var pathData = [
        new Vector(400, 0),
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
        new Vector(300, 0),
        new Vector(0, -200),
        new Vector(300, 0),
    ];

    // Array die de leerlingen opslaat en variabelen voor het aantal leerlingen en de gezondheid van de vijand.
    let leerlingen = [];
    const NUM_leerlingen = 10;
    let enemyHealth = 100;

    // Functie om leerlingen te spawnen met een tijdvertraging tussen elke leerling.
    function spawnLeerlingen() {
        for (let i = 0; i < NUM_leerlingen; i++) {
            setTimeout(() => {
                let newLeerling = new Leerling(new Vector(startPos.x, startPos.y), 30, 100, 10);
                leerlingen.push(newLeerling); // Voegt een nieuwe leerling toe aan de array.
            }, i * 1000); // Elke leerling wordt na 1 seconde interval toegevoegd.
        }
    }

    // Roep de spawn-functie aan om leerlingen te genereren.
    spawnLeerlingen();

    // Functie om alle leerlingen te updaten.
    function update() {
        leerlingen.forEach(l => l.update());
    }

    // Functie om het eindpunt van het pad te berekenen.
    function calculatePathEnd() {
        let endPos = new Vector(startPos.x, startPos.y);
        for (let path of pathData) {
            endPos.x += path.x;
            endPos.y += path.y;
        }
        return endPos;
    }

    // Bereken het eindpunt van het pad en sla het op in `pathEnd`.
    const pathEnd = calculatePathEnd();

    // Functie om het pad visueel te tekenen op de canvas.
    function renderPath() {
        let drawPos = new Vector(startPos.x, startPos.y);
        ctx.fillStyle = "brown";
        pathData.forEach((path) => {
            let x = drawPos.x;
            let y = drawPos.y;
            let w = Math.abs(path.x);
            let h = Math.abs(path.y);
            if (path.x !== 0) {
                ctx.fillRect(x, y - tile, w, tile * 2); // Horizontale paden tekenen.
            } else {
                ctx.fillRect(x - tile, y + (path.y > 0 ? 0 : path.y), tile * 2, h); // Verticale paden tekenen.
            }
            ctx.fillRect(x - tile, y - tile, tile * 2, tile * 2); // Kruispunten tekenen.
            drawPos.x += path.x;
            drawPos.y += path.y;
        });
    }

    // Functie om een grid te tekenen voor het speelveld.
    function renderGrid() {
        ctx.fillStyle = "black";
        ctx.font = "50px Arial";
        ctx.fillText("Wave 1", 1700, 50);
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

    // Functie om de achtergrond, het pad, het grid en de leerlingen op de canvas te tekenen.
    function render() {
        ctx.fillStyle = bgcolor;
        ctx.fillRect(0, 0, sw, sh);
        renderPath(); // Tekent het pad.
        renderGrid(); // Tekent het raster.
        leerlingen.forEach(l => l.render()); // Tekent alle leerlingen.
        document.getElementById("health").value = enemyHealth; // Update de gezondheidsbalk.
        if (enemyHealth < 1) {
            window.location.href = 'level1.html'; // Ga naar het volgende level als de vijand is verslagen.
        }
    }

    // Functie die elke frame de update- en render-functies aanroept.
    function play() {
        update(); // Update de status van het spel.
        render(); // Render het spel op de canvas.
    }

    // Start een game-loop die 60 keer per seconde de play-functie aanroept.
    setInterval(play, 1000 / 60);

    // Array om torens op te slaan en variabele om de geselecteerde toren bij te houden.
    const towers = [];
    let selectedTower = null;

    // Klasse om torens te definiëren.
    class Tower {
        constructor(x, y) {
            this.x = x; // X-coördinaat van de toren.
            this.y = y; // Y-coördinaat van de toren.
            this.radius = 20; // Grootte van de toren.
        }

        // Tekent de toren op de canvas.
        draw() {
            ctx.fillStyle = 'green';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Plaatst een toren op een bepaalde positie en tekent alle torens opnieuw.
    function placeTower(x, y) {
        if (selectedTower) {
            towers.push(new Tower(x, y)); // Voeg een nieuwe toren toe aan de array.
            drawTowers(); // Tekent alle torens opnieuw.
            selectedTower = null; // Reset de geselecteerde toren.
            document.getElementById('tower1').classList.remove('selected'); // Verwijder de visuele selectie.
        }
    }

    // Tekent alle torens op de canvas.
    function drawTowers() {
        towers.forEach(tower => tower.draw());
    }

    // Event listener voor klikken op de canvas. Plaatst een toren waar er geklikt wordt.
    canvas.addEventListener('click', function(event) {
        if (selectedTower) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            placeTower(mouseX, mouseY); // Plaats de toren op de geklikte positie.
        }
    });

    // Event listener voor het selecteren van een toren uit de interface.
    document.getElementById('tower1').addEventListener('click', function() {
        selectedTower = 'basicTower'; // Markeer dat een basis toren is geselecteerd.
        document.getElementById('tower1').classList.add('selected'); // Voeg een visueel effect toe aan de geselecteerde toren.
    });
});