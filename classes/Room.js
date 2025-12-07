export class Room {
    constructor(scene, ship, x, y, width, height, type = 'floor') {
        this.scene = scene;
        this.ship = ship;
        // Grid coordinates
        this.gridX = x;
        this.gridY = y;
        this.width = width; // in tiles
        this.height = height; // in tiles
        this.type = type; // 'floor', 'wall', 'space'

        this.oxygen = 100;
        this.system = null; // Reference to a ShipSystem if installed here

        // Visuals
        this.tileSize = 32;
        this.sprites = [];
        this.initializeVisuals();
    }

    initializeVisuals() {
        // Draw tiles for the room
        for (let py = 0; py < this.height; py++) {
            for (let px = 0; px < this.width; px++) {
                const worldX = (this.gridX + px) * this.tileSize;
                const worldY = (this.gridY + py) * this.tileSize;

                const sprite = this.scene.add.rectangle(
                    worldX + this.tileSize / 2,
                    worldY + this.tileSize / 2,
                    this.tileSize - 2,
                    this.tileSize - 2,
                    this.getColorForType(this.type)
                );

                // Add physics for walls
                if (this.type === 'wall') {
                    this.scene.physics.add.existing(sprite, true); // Create static body
                    if (this.ship && this.ship.wallGroup) {
                        this.ship.wallGroup.add(sprite);
                    }
                }

                // Oxygen Dots (Visuals only for non-walls)
                const dots = [];
                if (this.type !== 'wall' && this.type !== 'space') {
                    // Create 3-5 random small dots per tile
                    const dotCount = 3 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < dotCount; i++) {
                        const dx = (Math.random() * (this.tileSize - 4)) - (this.tileSize / 2 - 2);
                        const dy = (Math.random() * (this.tileSize - 4)) - (this.tileSize / 2 - 2);

                        const dot = this.scene.add.rectangle(
                            worldX + this.tileSize / 2 + dx,
                            worldY + this.tileSize / 2 + dy,
                            2, 2,
                            0x0088ff // Light Blue
                        );
                        dot.setDepth(1); // Above floor
                        dots.push(dot);
                    }
                }

                this.sprites.push({ sprite, localX: px, localY: py, dots });
            }
        }
    }

    getColorForType(type) {
        switch (type) {
            case 'wall': return 0xCCCC00; // Yellow-ish
            case 'space': return 0x000000;
            case 'entrance': return 0x0044ff; // Blue entrance
            default: return 0x444444; // Dark Grey Floor
        }
    }

    installSystem(system, isImpassable = false) {
        console.log(`Room at ${this.gridX},${this.gridY} installing system: ${system.name} (Impassable: ${isImpassable})`);
        this.system = system;
        // Visual indicator for system
        const centerX = (this.gridX * this.tileSize) + (this.width * this.tileSize) / 2;
        const centerY = (this.gridY * this.tileSize) + (this.height * this.tileSize) / 2;

        let label = system.name.substring(0, 3);
        let textColor = '#000';
        let bgColor = '#fff';

        // Custom Visuals based on system type
        let spriteColor = null;

        if (system.name === 'Shields') { // Powerplant
            spriteColor = 0xffffff; // White
            label = "Powerplant"; // Explicit label
        } else if (system.name === 'Oxygen') {
            spriteColor = 0x00ff00; // Green
        } else if (system.name === 'Engines') {
            spriteColor = 0x000000; // Black
            label = "ENG";
            textColor = '#ffffff';
            bgColor = null;
        }

        this.sprites.forEach(s => {
            if (spriteColor !== null) {
                s.sprite.setFillStyle(spriteColor);
                s.customColor = spriteColor; // Store for updates
            }
        });

        // Text creation with safety for standard styling
        const style = { font: '12px monospace', fill: textColor };
        if (bgColor) style.backgroundColor = bgColor;

        this.sysText = this.scene.add.text(centerX, centerY, label, style).setOrigin(0.5).setDepth(2);

        // Make sprites impassable if requested
        if (isImpassable) {
            console.log(`Making ${this.sprites.length} sprites impassable for ${system.name} at ${this.gridX},${this.gridY}`);
            this.sprites.forEach(s => {
                this.scene.physics.add.existing(s.sprite, true);
                if (this.ship && this.ship.wallGroup) {
                    this.ship.wallGroup.add(s.sprite);
                    console.log("Added system sprite to wallGroup. Body enabled:", s.sprite.body.enable);
                }
            });
        }
    }

    updateVisuals() {
        // Visualize Oxygen from Ship's Grid
        if (!this.ship || !this.ship.o2Grid) return;

        this.sprites.forEach(s => {
            if (this.type !== 'wall') {
                const gx = this.gridX + s.localX;
                const gy = this.gridY + s.localY;

                // Safety check for bounds
                if (gy < this.ship.o2Grid.length && gx < this.ship.o2Grid[0].length) {
                    const o2Level = this.ship.o2Grid[gy][gx];
                    const o2Ratio = o2Level / 100;

                    // Update Dots Alpha
                    if (s.dots) {
                        s.dots.forEach(d => {
                            d.setAlpha(o2Ratio); // 1.0 = visible, 0.0 = invisible
                        });
                    }

                    // Only reset color if no custom color is set
                    if (s.customColor !== undefined) {
                        s.sprite.setFillStyle(s.customColor);
                    } else {
                        s.sprite.setFillStyle(this.getColorForType(this.type));
                    }
                }
            }
        });
    }

    destroy() {
        this.sprites.forEach(s => {
            s.sprite.destroy();
            if (s.dots) s.dots.forEach(d => d.destroy());
        });
        if (this.sysText) {
            this.sysText.destroy();
        }
    }
}
