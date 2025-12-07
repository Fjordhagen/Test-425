import { Room } from './Room.js';
import { OxygenSystem, EnginesSystem, ShieldsSystem } from './System.js';

export class Ship {
    constructor(scene, gridWidth, gridHeight) {
        this.scene = scene;
        this.width = gridWidth;
        this.height = gridHeight;
        this.tileSize = 32;

        this.doors = [];
        this.pilotSeat = null;
        this.rooms = [];
        this.systems = {
            oxygen: new OxygenSystem(),
            engines: new EnginesSystem(),
            shields: new ShieldsSystem()
        };

        this.isVenting = false;
        this.wallGroup = this.scene.physics.add.staticGroup();
        this.o2Grid = [];
        this.structureGrid = [];

        for (let y = 0; y < this.height; y++) {
            this.o2Grid[y] = [];
            this.structureGrid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.o2Grid[y][x] = 0;
                this.structureGrid[y][x] = 0;
            }
        }

        this.initializeLayout();
    }

    initializeLayout() {
        this.addRoom(6, 6, 12, 3, 'floor');
        this.addRoom(18, 6, 4, 3, 'floor');
        const helm = this.getRoomAt(19, 7);
        if (helm) helm.installSystem(this.systems.oxygen, false);

        this.addRoom(6, 3, 3, 3, 'floor');
        const engine = this.getRoomAt(7, 4);
        // if (engine) engine.installSystem(this.systems.engines); // Removed per request

        this.addRoom(6, 9, 3, 3, 'floor');
        const oxy = this.getRoomAt(7, 10);
        // if (oxy) oxy.installSystem(this.systems.engines); // Removed per request

        for (let y = 6; y <= 8; y++) {
            this.addRoom(5, y, 1, 1, 'entrance');
        }

        this.generateHull();

        this.replaceTileWithRoom(4, 6, 1, 1, 'space');
        this.replaceTileWithRoom(4, 7, 1, 1, 'space');
        this.replaceTileWithRoom(4, 8, 1, 1, 'space');

        this.replaceTileWithRoom(5, 4, 1, 1, 'wall');
        this.replaceTileWithRoom(5, 6, 1, 1, 'entrance'); // MOVED from 5,7
        this.replaceTileWithRoom(5, 7, 1, 1, 'wall'); // ARMORED (was entrance)
        this.replaceTileWithRoom(5, 8, 1, 1, 'wall');

        this.replaceTileWithRoom(6, 5, 1, 1, 'wall');
        this.replaceTileWithRoom(8, 5, 1, 1, 'wall');
        this.replaceTileWithRoom(6, 9, 1, 1, 'wall');
        this.replaceTileWithRoom(8, 9, 1, 1, 'wall');

        this.replaceTileWithRoom(6, 3, 1, 1, 'floor');
        this.replaceTileWithRoom(6, 4, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 3, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 4, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 5, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 3, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 4, 1, 1, 'floor');

        this.replaceTileWithRoom(6, 10, 1, 1, 'floor');
        this.replaceTileWithRoom(6, 11, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 9, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 10, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 11, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 10, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 11, 1, 1, 'floor');

        this.replaceTileWithRoom(21, 6, 1, 1, 'wall');
        this.replaceTileWithRoom(21, 7, 1, 1, 'wall');
        this.replaceTileWithRoom(21, 8, 1, 1, 'wall');

        this.replaceTileWithRoom(18, 6, 3, 3, 'floor');

        const bridgeTile = this.getRoomAt(19, 7);
        if (bridgeTile) bridgeTile.installSystem(this.systems.oxygen, false); // FIX: Bridge should be walkable!

        // Engines at 7,10 and 7,4 removed per request

        // Create doors
        this.replaceTileWithRoom(11, 8, 1, 1, 'floor'); // FIX: Ensure floor under door
        this.createDoor(7, 5, 'horizontal');
        this.createDoor(7, 9, 'horizontal');
        this.createDoor(11, 8, 'vertical'); // Swapped from 11,7
        this.createDoor(16, 8, 'vertical');
        this.createDoor(19, 7, 'vertical'); // Bridge entrance
        this.createDoor(5, 6, 'vertical');  // Moved to 5,6

        // Add walls (armor)
        this.replaceTileWithRoom(11, 6, 1, 1, 'wall');
        this.replaceTileWithRoom(11, 7, 1, 1, 'wall'); // Swapped from 11,8
        this.replaceTileWithRoom(16, 6, 1, 1, 'wall'); // New
        this.replaceTileWithRoom(16, 7, 1, 1, 'wall'); // New
        // SEAL THE PERIMETER (Manual Override)
        // Left Wall (x=5) - Skip Door at 7
        for (let y = 2; y <= 12; y++) {
            if (y !== 6) this.replaceTileWithRoom(5, y, 1, 1, 'wall'); // Skip door at 6
        }

        // Right Wall of Engine Rooms (x=9)
        for (let y = 2; y <= 5; y++) this.replaceTileWithRoom(9, y, 1, 1, 'wall'); // Top
        for (let y = 9; y <= 12; y++) this.replaceTileWithRoom(9, y, 1, 1, 'wall'); // Bottom

        // Top Cap (y=2)
        for (let x = 6; x <= 8; x++) this.replaceTileWithRoom(x, 2, 1, 1, 'wall');

        // Bottom Cap (y=12)
        for (let x = 6; x <= 8; x++) this.replaceTileWithRoom(x, 12, 1, 1, 'wall');

        // Add missing floor tiles inside ship
        this.replaceTileWithRoom(9, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(9, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(9, 8, 1, 1, 'floor');
        this.replaceTileWithRoom(10, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(10, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(10, 8, 1, 1, 'floor');
        // this.replaceTileWithRoom(11, 7, 1, 1, 'floor'); // Removed (now wall)

        // Add floor tiles 6,6 to 6,8
        this.replaceTileWithRoom(6, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(6, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(6, 8, 1, 1, 'floor');

        // Add floor tiles 7,6 to 7,8
        this.replaceTileWithRoom(7, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(7, 8, 1, 1, 'floor');

        // Add floor tiles 8,6 to 8,8
        this.replaceTileWithRoom(8, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(8, 8, 1, 1, 'floor');

        // Add floor tiles 12,6 to 18,8 (7x3 area)
        for (let x = 12; x <= 18; x++) {
            for (let y = 6; y <= 8; y++) {
                this.replaceTileWithRoom(x, y, 1, 1, 'floor');
            }
        }

        // Add floor tiles 19,6 to 19,8
        this.replaceTileWithRoom(19, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(19, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(19, 8, 1, 1, 'floor');

        // Add floor tiles 20,6 to 20,8
        this.replaceTileWithRoom(20, 6, 1, 1, 'floor');
        this.replaceTileWithRoom(20, 7, 1, 1, 'floor');
        this.replaceTileWithRoom(20, 8, 1, 1, 'floor');

        // RE-ADD armor that was overwritten by floor tiles loop
        this.replaceTileWithRoom(16, 6, 1, 1, 'wall');
        this.replaceTileWithRoom(16, 7, 1, 1, 'wall');
        this.replaceTileWithRoom(19, 6, 1, 1, 'wall'); // Bridge entrance
        this.replaceTileWithRoom(19, 8, 1, 1, 'wall'); // Bridge entrance

        // CRITICAL: Re-install systems after all floor tile replacements
        // Oxygen system moved to 12,6
        const oxygenTile = this.getRoomAt(12, 6);
        if (oxygenTile) {
            oxygenTile.installSystem(this.systems.oxygen, true);
            console.log("Oxygen system installed at 12,6");
        }

        // Engine systems - expanded coverage (10 tiles total)
        const engineTiles = [
            this.getRoomAt(6, 10),  // Moved from 7,10
            this.getRoomAt(6, 4),   // Moved from 7,4
            this.getRoomAt(6, 11),  // New
            this.getRoomAt(7, 11),  // New
            this.getRoomAt(8, 11),  // New
            this.getRoomAt(8, 10),  // New
            this.getRoomAt(6, 3),   // New
            this.getRoomAt(7, 3),   // New
            this.getRoomAt(8, 3),   // New
            this.getRoomAt(8, 4),   // New
            this.getRoomAt(20, 6),  // New
            this.getRoomAt(20, 8)   // New
        ];

        engineTiles.forEach(tile => {
            if (tile) tile.installSystem(this.systems.engines, true);
        });
        console.log("Engine systems installed at 10 tiles");

        // Power Plant system (Consolidated 3x2 room at 13,6)
        this.replaceTileWithRoom(13, 6, 3, 2, 'floor');
        const powerPlant = this.getRoomAt(13, 6);
        if (powerPlant) {
            powerPlant.installSystem(this.systems.shields, true);
        }
        console.log("Power Plant system installed at 13,6 (3x2)");

        // Pilot Seat moved to 17,6 (Updated)
        this.createPilotSeat(17, 6);

        // Bed at 18,8
        this.createBed(18, 8);

        this.drawGridCoordinates();

        // Check for hull breaches/leaks
        this.checkHullIntegrity();
    }

    checkHullIntegrity() {
        console.log("--- Checking Hull Integrity ---");
        let leaksFound = 0;
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        // ASCII Dump for Visual Verification
        let mapString = "\n   012345678901234567890123456789\n";
        for (let y = 0; y < this.height; y++) {
            let row = `${y.toString().padStart(2, '0')} `;
            for (let x = 0; x < this.width; x++) {
                const val = this.structureGrid[y][x];
                if (val === 0) row += "."; // Space
                else if (val === 1) row += "#"; // Wall
                else if (val === 2) row += "_"; // Floor
                else row += "?";
            }
            mapString += row + "\n";
        }
        console.log("Structure Grid Map:" + mapString);

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // If this is a Floor tile (2)
                if (this.structureGrid[y][x] === 2) {
                    // Check neighbors
                    for (let d of directions) {
                        const nx = x + d.x;
                        const ny = y + d.y;

                        // Check if out of bounds or Space (0)
                        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height || this.structureGrid[ny][nx] === 0) {
                            console.warn(`LEAK DETECTED at ${x},${y}! Adjacent to vacuum/bound at ${nx},${ny}`);
                            leaksFound++;

                            // Visual indicator for leak (Red 'X')
                            this.scene.add.text(
                                (x * 32) + 16, (y * 32) + 16, "X",
                                { font: '20px Arial', fill: '#ff0000', stroke: '#000', strokeThickness: 2 }
                            ).setOrigin(0.5).setDepth(100);
                        }
                    }
                }
            }
        }

        if (leaksFound === 0) {
            console.log("Hull Integrity: 100% - No leaks detected.");
        } else {
            console.warn(`Hull Integrity: CRITICAL - ${leaksFound} leaks detected!`);
        }
        console.log("-------------------------------");
    }

    createBed(x, y) {
        const bed = this.scene.add.rectangle(
            (x * 32) + 16,
            (y * 32) + 16,
            24, 24,
            0x00ffff // Cyan/Teal for Bed
        ).setDepth(1);

        this.scene.add.text(
            (x * 32) + 16,
            (y * 32) + 16,
            "BED",
            { font: '10px monospace', fill: '#000000' }
        ).setOrigin(0.5).setDepth(2);

        this.bed = {
            x: x,
            y: y,
            sprite: bed
        };
    }

    createDoor(doorX, doorY, orientation = 'vertical') {
        // Determine door dimensions based on orientation
        const width = orientation === 'horizontal' ? 32 : 8;
        const height = orientation === 'horizontal' ? 8 : 32;

        const barrier = this.scene.add.rectangle(
            (doorX * 32) + 16,
            (doorY * 32) + 16,
            width, height,
            0xffffff
        ).setDepth(5);
        this.scene.physics.add.existing(barrier, true);
        this.wallGroup.add(barrier);

        this.structureGrid[doorY][doorX] = 1;
        this.o2Grid[doorY][doorX] = 0;

        this.doors.push({
            x: doorX,
            y: doorY,
            isOpen: false,
            barrierSprite: barrier
        });
    }

    createPilotSeat(x, y) {
        const seat = this.scene.add.rectangle(
            (x * 32) + 16,
            (y * 32) + 16,
            24, 24,
            0x0088ff
        ).setDepth(5);

        // Add physics to make it impassable
        this.scene.physics.add.existing(seat, true);
        this.wallGroup.add(seat);

        this.pilotSeat = {
            x: x,
            y: y,
            isActive: false,
            sprite: seat
        };
    }

    handleInteraction(playerX, playerY) {
        const playerGridX = Math.floor(playerX / 32);
        const playerGridY = Math.floor(playerY / 32);

        console.log(`Ship: Player at tile ${playerGridX},${playerGridY}`);

        // Check pilot seat with distance-based detection (40px = 125% of tile)
        if (this.pilotSeat) {
            const seatCenterX = (this.pilotSeat.x * 32) + 16;
            const seatCenterY = (this.pilotSeat.y * 32) + 16;

            const dx = playerX - seatCenterX;
            const dy = playerY - seatCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 40) {
                console.log(`Pilot Seat Toggled! Distance: ${distance.toFixed(1)}`);
                return { type: 'pilotSeat', action: 'toggle' };
            }
        }

        // Distance-based door interaction (32px)
        this.doors.forEach(door => {
            const doorCenterX = (door.x * 32) + 16;
            const doorCenterY = (door.y * 32) + 16;

            const dx = playerX - doorCenterX;
            const dy = playerY - doorCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 32) {
                console.log(`Door at ${door.x},${door.y} toggled! Distance: ${distance.toFixed(1)}`);
                this.toggleDoor(door);
            }
        });

        return null;
    }

    toggleDoor(door) {
        if (door.isOpen && this.isDoorBlocked(door)) {
            console.log("Door blocked - cannot close!");
            return;
        }

        door.isOpen = !door.isOpen;

        if (door.isOpen) {
            door.barrierSprite.setVisible(false);
            door.barrierSprite.body.enable = false;
            this.structureGrid[door.y][door.x] = 2;
        } else {
            door.barrierSprite.setVisible(true);
            door.barrierSprite.body.enable = true;
            this.structureGrid[door.y][door.x] = 1;
        }
    }

    isDoorBlocked(door) {
        const doorCenterX = (door.x * 32) + 16;
        const doorCenterY = (door.y * 32) + 16;

        const checkBounds = new Phaser.Geom.Rectangle(
            doorCenterX - 10,
            doorCenterY - 10,
            20,
            20
        );

        const bodies = this.scene.physics.world.bodies.entries;

        for (let body of bodies) {
            if (body.gameObject === door.barrierSprite) continue;
            if (!body.enable) continue;

            const bodyCenterX = body.x;
            const bodyCenterY = body.y;

            if (checkBounds.contains(bodyCenterX, bodyCenterY)) {
                console.log(`Door blocked at ${bodyCenterX.toFixed(1)}, ${bodyCenterY.toFixed(1)}`);
                return true;
            }
        }

        return false;
    }

    togglePilotSeat() {
        if (!this.pilotSeat) return false;

        this.pilotSeat.isActive = !this.pilotSeat.isActive;

        if (this.pilotSeat.isActive) {
            this.pilotSeat.sprite.setFillStyle(0x00ff88);
        } else {
            this.pilotSeat.sprite.setFillStyle(0x0088ff);
        }

        return this.pilotSeat.isActive;
    }

    drawGridCoordinates() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.scene.add.text(
                    x * this.tileSize + 2,
                    (y + 1) * this.tileSize - 2,
                    `${x},${y}`,
                    {
                        font: '10px monospace',
                        fill: '#ffffff'
                    }
                )
                    .setOrigin(0, 1)
                    .setScale(0.5)
                    .setResolution(2)
                    .setDepth(200);
            }
        }
    }

    generateHull() {
        const occupied = new Set();
        this.rooms.forEach(r => {
            for (let py = 0; py < r.height; py++) {
                for (let px = 0; px < r.width; px++) {
                    occupied.add(`${r.gridX + px},${r.gridY + py}`);
                }
            }
        });

        const wallsNeeded = new Set();
        const directions = [
            { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
        ];

        this.rooms.forEach(r => {
            for (let py = 0; py < r.height; py++) {
                for (let px = 0; px < r.width; px++) {
                    const gx = r.gridX + px;
                    const gy = r.gridY + py;

                    directions.forEach(d => {
                        const neighborKey = `${gx + d.x},${gy + d.y}`;
                        if (!occupied.has(neighborKey)) {
                            wallsNeeded.add(neighborKey);
                        }
                    });
                }
            }
        });

        wallsNeeded.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            this.addRoom(x, y, 1, 1, 'wall');
        });
    }

    addRoom(x, y, w, h, type) {
        const room = new Room(this.scene, this, x, y, w, h, type);
        this.rooms.push(room);

        const isWall = type === 'wall';
        const isSpace = type === 'space';
        const typeId = isWall ? 1 : (isSpace ? 0 : 2);

        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                if (y + py < this.height && x + px < this.width) {
                    this.structureGrid[y + py][x + px] = typeId;

                    if (!isSpace && !isWall) {
                        this.o2Grid[y + py][x + px] = 100;
                    }
                }
            }
        }
    }

    replaceTileWithRoom(x, y, w, h, type) {
        for (let i = this.rooms.length - 1; i >= 0; i--) {
            const r = this.rooms[i];
            if (x >= r.gridX && x < r.gridX + r.width &&
                y >= r.gridY && y < r.gridY + r.height) {
                r.destroy();
                this.rooms.splice(i, 1);
            }
        }

        this.addRoom(x, y, w, h, type);
    }

    getRoomAt(gridX, gridY) {
        return this.rooms.find(r =>
            gridX >= r.gridX && gridX < r.gridX + r.width &&
            gridY >= r.gridY && gridY < r.gridY + r.height
        );
    }

    update(time, delta) {
        this.simulateOxygen();
        this.rooms.forEach(r => r.updateVisuals());
    }

    simulateOxygen() {
        const diffusionRate = 0.1; // Reduced from 0.25 to maintain pressure
        const newGrid = this.o2Grid.map(row => [...row]);

        let totalO2 = 0;
        let validTiles = 0;

        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                if (this.structureGrid[y][x] === 1) {
                    newGrid[y][x] = 0;
                    continue;
                }

                let total = 0;
                let count = 0;

                const coords = [
                    { x: x, y: y - 1 },
                    { x: x, y: y + 1 },
                    { x: x - 1, y: y },
                    { x: x + 1, y: y }
                ];

                coords.forEach(c => {
                    const type = this.structureGrid[c.y][c.x];
                    if (type !== 1) {
                        total += this.o2Grid[c.y][c.x];
                        count++;
                    }
                });

                if (count > 0) {
                    const avg = total / count;
                    newGrid[y][x] = this.o2Grid[y][x] + (avg - this.o2Grid[y][x]) * diffusionRate;
                }
            }
        }

        if (this.systems.oxygen.isActive && this.systems.oxygen.currentPower > 0) {
            // FIX: Find ALL rooms with oxygen, not just the first one
            const o2Rooms = this.rooms.filter(r => r.system === this.systems.oxygen);

            o2Rooms.forEach(o2Room => {
                const production = this.systems.oxygen.productionRate * 10.0; // Restored to 10.0 (Reasonable boost)

                for (let py = 0; py < o2Room.height; py++) {
                    for (let px = 0; px < o2Room.width; px++) {
                        const gx = o2Room.gridX + px;
                        const gy = o2Room.gridY + py;
                        newGrid[gy][gx] = Math.min(100, newGrid[gy][gx] + production);
                    }
                }
            });
        }

        if (this.isVenting) {
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.structureGrid[y][x] !== 1) {
                        if (newGrid[y][x] > 0) newGrid[y][x] -= 5.0;
                        if (newGrid[y][x] < 0) newGrid[y][x] = 0;
                    }
                }
            }
        }

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.structureGrid[y][x] !== 2) {
                    newGrid[y][x] = 0;
                } else {
                    validTiles++;
                    totalO2 += newGrid[y][x];
                }
            }
        }

        this.o2Grid = newGrid;
        this.averageOxygen = validTiles > 0 ? (totalO2 / validTiles) : 0;
    }

    getAverageOxygenLevel() {
        return this.averageOxygen || 0;
    }

    consumeOxygenAtPosition(worldX, worldY, amount) {
        const gx = Math.floor(worldX / this.tileSize);
        const gy = Math.floor(worldY / this.tileSize);

        if (gx >= 0 && gx < this.width && gy >= 0 && gy < this.height) {
            if (this.o2Grid[gy][gx] > 0) {
                this.o2Grid[gy][gx] = Math.max(0, this.o2Grid[gy][gx] - amount);
            }
        }
    }
}
