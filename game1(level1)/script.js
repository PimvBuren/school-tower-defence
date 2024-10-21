document.addEventListener('DOMContentLoaded', function () {
    // Verkrijg het canvas-element en de 2D tekencontext
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext("2d");

    // Basisinstellingen voor het canvas
    const sw = canvas.width; // Breedte van het canvas
    const sh = canvas.height; // Hoogte van het canvas
    const tile = 25; // Grootte van de grid (25 pixels)
    var bgcolor = "green"; // Achtergrondkleur van het canvas

    // Stel het lettertype in en geef de tekst "wave 1" weer
    ctx.font = "50px Arial";
    ctx.fillText("wave 1", 300, 800);

    // Vector klasse voor 2D-coördinaten
    class Vector {
        constructor(x, y) {
            this.x = x; // x-coördinaat
            this.y = y; // y-coördinaat
        }
    }

    // Leerling klasse
    class Leerling {
        constructor(pos, r, health, attack) {
            this.pos = pos; // Positie van de leerling
            this.r = r; // Straal van de leerling
            this.health = health; // Gezondheid van de leerling
            this.attack = attack; // Aanvalskracht van de leerling
            this.currentTargetIndex = 0; // Index van het huidige doel
            this.speed = 2; // Snelheid van de leerling
            this.minTargetDist = 2; // Minimale afstand tot het doel
            this.targets = this.calculateTargets(); // Bereken de doelen
            this.currentTarget = this.targets[this.currentTargetIndex]; // Huidige doel
        }

        // Methode om de doelposities te berekenen
        calculateTargets() {
            let targets = []; // Array voor de doelen
            let drawPos = new Vector(startPos.x, startPos.y); // Startpositie
            for (let path of pathData) {
                drawPos.x += path.x; // Voeg de x-verplaatsing toe
                drawPos.y += path.y; // Voeg de y-verplaatsing toe
                targets.push(new Vector(drawPos.x, drawPos.y)); // Voeg het doel toe aan de array
            }
            return targets; // Retourneer de array met doelen
        }

        // Methode om de leerling te updaten (bewegen)
        update() {
            if (this.currentTarget == null) return; // Stop als er geen doel is
            let dir = new Vector(this.currentTarget.x - this.pos.x, this.currentTarget.y - this.pos.y); // Richting naar het doel
            let distance = Math.sqrt(dir.x ** 2 + dir.y ** 2); // Bereken de afstand tot het doel
            if (distance < this.minTargetDist) { // Als de leerling dichtbij het doel is
                this.currentTargetIndex++; // Ga naar het volgende doel
                this.currentTarget = this.currentTargetIndex < this.targets.length ? this.targets[this.currentTargetIndex] : null; // Stel het nieuwe doel in
            } else {
                // Normaliseer de richting en verplaats de leerling
                dir.x /= distance;
                dir.y /= distance;
                this.pos.x += dir.x * this.speed; // Verplaats in de x-richting
                this.pos.y += dir.y * this.speed; // Verplaats in de y-richting
            }
            // Als de leerling het eindpunt bereikt, verminder de gezondheid van de vijand
            if (this.pos.x >= pathEnd.x && this.pos.y >= pathEnd.y) {
                enemyHealth -= this.attack; // Verminder vijandelijke gezondheid
                this.health = 10; // Reset de gezondheid van de leerling
            }
        }

        // Methode om de leerling te renderen
        render() {
            ctx.fillStyle = "blue"; // Kleur voor de leerling
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.r, 0, Math.PI * 2); // Teken een cirkel voor de leerling
            ctx.fill(); // Vul de cirkel
        }
    }

    // Startpositie van de leerlingen
    var startPos = new Vector(0, 625); 
    // Array met verplaatsingen voor het pad
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

    let leerlingen = []; // Array voor leerlingen
    const NUM_leerlingen = 10; // Aantal te spawnen leerlingen
    let enemyHealth = 100; // Gezondheid van de vijand

    // Methode om leerlingen te spawnen
    function spawnLeerlingen() {
        for (let i = 0; i < NUM_leerlingen; i++) {
            setTimeout(() => {
                let newLeerling = new Leerling(new Vector(startPos.x, startPos.y), 30, 100, 5); // Maak een nieuwe leerling
                leerlingen.push(newLeerling); // Voeg de leerling toe aan de array
            }, i * 1000); // Tijd tussen spawnen
        }
    }

    spawnLeerlingen(); // Roep de spawnfunctie aan

    // Update functie voor het spel
    function update() {
        leerlingen.forEach(l => l.update()); // Update alle leerlingen
    }

    // Functie om de eindpositie van het pad te berekenen
    function calculatePathEnd() {
        let endPos = new Vector(startPos.x, startPos.y); // Start met de startpositie
        for (let path of pathData) {
            endPos.x += path.x; // Voeg de x-verplaatsing toe
            endPos.y += path.y; // Voeg de y-verplaatsing toe
        }
        return endPos; // Retourneer de eindpositie
    }

    const pathEnd = calculatePathEnd(); // Bereken de eindpositie van het pad

    // Functie om het pad te renderen
    function renderPath() {
        let drawPos = new Vector(startPos.x, startPos.y); // Begin bij de startpositie
        ctx.fillStyle = "brown"; // Kleur voor het pad
        pathData.forEach((path) => {
            let x = drawPos.x; // Huidige x-positie
            let y = drawPos.y; // Huidige y-positie
            let w = Math.abs(path.x); // Breedte van de rechthoek
            let h = Math.abs(path.y); // Hoogte van de rechthoek
            if (path.x !== 0) { // Als er een horizontale verplaatsing is
                ctx.fillRect(x, y - tile, w, tile * 2); // Teken de rechthoek
            } else { // Als er een verticale verplaatsing is
                ctx.fillRect(x - tile, y + (path.y > 0 ? 0 : path.y), tile * 2, h); // Teken de rechthoek
            }
            ctx.fillRect(x - tile, y - tile, tile * 2, tile * 2); // Teken een tegel op het kruispunt
            drawPos.x += path.x; // Werk de huidige positie bij
            drawPos.y += path.y; // Werk de huidige positie bij
        });
    }

    // Functie om de grid te renderen
    function renderGrid() {
        ctx.fillStyle = "black"; // Kleur voor de gridlijnen
        ctx.font = "50px Arial"; // Lettertype voor tekst
        ctx.fillText("Wave 1", 1700, 50); // Weergave van de tekst "Wave 1"
        let x = 0; // Begin x-positie
        for (let i = 0; i < sw / tile; i++) {
            ctx.beginPath();
            ctx.moveTo(x, 0); // Startlijn
            ctx.lineTo(x, sh); // Eindlijn
            ctx.stroke(); // Teken de lijn
            x += tile; // Werk de x-positie bij
        }
        let y = 0; // Begin y-positie
        for (let i = 0; i < sh / tile; i++) {
            ctx.beginPath();
            ctx.moveTo(0, y); // Startlijn
            ctx.lineTo(sw, y); // Eindlijn
            ctx.stroke(); // Teken de lijn
            y += tile; // Werk de y-positie bij
        }
    }

    // Functie om het spel te renderen
    function render() {
        ctx.fillStyle = bgcolor; // Stel de achtergrondkleur in
        ctx.fillRect(0, 0, sw, sh); // Vul het canvas
        renderPath(); // Render het pad
        renderGrid(); // Render de grid
        drawTowers(); // Render de torens
        leerlingen.forEach(l => l.render()); // Render alle leerlingen
        document.getElementById("health").value = enemyHealth; // Update de gezondheid van de vijand in de interface
        if (enemyHealth < 1) { // Controleer of de vijand gedood is
            window.location.href = 'level1.html'; // Ga naar de volgende level
        }
    }

    // Functie om het spel te laten draaien
    function play() {
        update(); // Update het spel
        render(); // Render het spel
    }

    // Start de spelsnelheid
    setInterval(play, 1000 / 60); // 60 FPS

    const towers = []; // Array voor torens
    let selectedTower = null; // Huidige geselecteerde toren

    // Toren klasse
    class Tower {
        constructor(x, y) {
            this.x = x; // x-positie van de toren
            this.y = y; // y-positie van de toren
            this.radius = 20; // Straal van de toren
        }

        // Methode om de toren te tekenen
        draw() {
            ctx.fillStyle = 'red'; // Kleur voor de toren
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // Teken een cirkel voor de toren
            ctx.fill(); // Vul de cirkel
        }
    }

    // Functie om een toren te plaatsen
    function placeTower(x, y) {
        if (selectedTower) { // Als er een toren is geselecteerd
            towers.push(new Tower(x, y)); // Voeg de toren toe aan de array
            drawTowers(); // Teken de torens
            selectedTower = null; // Reset de geselecteerde toren
            document.getElementById('tower1').classList.remove('selected'); // Verwijder de selectie uit de interface
        }
    }

    // Functie om alle torens te tekenen
    function drawTowers() {
        towers.forEach(tower => tower.draw()); // Teken elke toren
    }

    // Event listener voor het klikken op het canvas
    canvas.addEventListener('click', function(event) {
        if (selectedTower) { // Als er een toren is geselecteerd
            const rect = canvas.getBoundingClientRect(); // Verkrijg de positie van het canvas
            const mouseX = event.clientX - rect.left; // Verkrijg de muis x-positie
            const mouseY = event.clientY - rect.top; // Verkrijg de muis y-positie
            placeTower(mouseX, mouseY); // Plaats de toren
        }
    });

    // Event listener voor het selecteren van de toren
    document.getElementById('tower1').addEventListener('click', function() {
        selectedTower = 'basicTower'; // Selecteer de basis toren
        document.getElementById('tower1').classList.add('selected'); // Markeer de geselecteerde toren
    });
});



