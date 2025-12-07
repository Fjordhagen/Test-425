import { Ship } from '../classes/Ship.js';
import { Player } from '../classes/Player.js';

export class ShipInterior extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipInterior' });
        this.controlMenu = null; // UI container for pilot seat controls
        this.lowOxygenTimer = 0; // Timer for grace period before damage starts
    }

    create() {
        // Initialize Ship Layout
        this.ship = new Ship(this, 30, 20);

        // Initialize Player
        // Spawning in the middle of the hallway to avoid instant exit at entrance (x=5)
        this.player = new Player(this, 12 * 32, 7 * 32);

        // Add Collision
        this.physics.add.collider(this.player.sprite, this.ship.wallGroup);

        // Camera Follow
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setZoom(2);

        // Launch UI Scene (runs in parallel)
        this.scene.launch('UIScene');

        // Debug Input to switch scene
        this.input.keyboard.on('keydown-M', () => {
            this.scene.start('SpaceExploration');
        });

        // Debug Input to toggle venting (Key V)
        this.input.keyboard.on('keydown-V', () => {
            if (this.ship) {
                this.ship.isVenting = !this.ship.isVenting;
                console.log("Venting toggled via Key V:", this.ship.isVenting);
            }
        });

        // Zoom Control
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const zoom = this.cameras.main.zoom;
            // Scroll down (positive deltaY) -> zoom out. Scroll up (negative deltaY) -> zoom in.
            const newZoom = zoom - (deltaY * 0.001);
            // Clamp zoom between 0.5 and 4.0
            this.cameras.main.setZoom(Phaser.Math.Clamp(newZoom, 0.5, 4.0));
        });
    }

    update(time, delta) {
        if (this.ship) this.ship.update(time, delta);
        if (this.player) {
            this.player.update(time, delta);

            // Player Oxygen Consumption
            const consumption = this.player.o2ConsumptionRate * (delta / 1000);
            this.ship.consumeOxygenAtPosition(this.player.sprite.x, this.player.sprite.y, consumption);

            // Suffocation Logic with 60s grace period
            // Check O2 at player position
            const gx = Math.floor(this.player.sprite.x / 32);
            const gy = Math.floor(this.player.sprite.y / 32);
            let localO2 = 0;

            // Bounds check
            if (gx >= 0 && gx < this.ship.width && gy >= 0 && gy < this.ship.height) {
                localO2 = this.ship.o2Grid[gy][gx];
            }

            // If O2 is low (< 10)
            if (localO2 < 10) {
                // Increment timer (in seconds)
                this.lowOxygenTimer += (delta / 1000);

                // Only start taking damage after 60 seconds
                if (this.lowOxygenTimer >= 60) {
                    // Damage per second (reduced by 50%: was 10, now 5)
                    const damageRate = 5;
                    const damage = damageRate * (delta / 1000);
                    this.player.health = Math.max(0, this.player.health - damage);

                    if (this.player.health <= 0) {
                        // console.log("Player suffocated!");
                        // Handle death?
                    }
                }
            } else {
                // Reset timer when oxygen is good
                this.lowOxygenTimer = 0;
                // Slow recovery if O2 is good
                this.player.health = Math.min(this.player.maxHealth, this.player.health + (5 * (delta / 1000)));
            }
        }

        // Check for exit
        this.checkExit();

        // Update control menu if visible
        if (this.controlMenu) {
            this.updateControlMenu();

            // Keep menu centered on camera
            const cam = this.cameras.main;
            const centerX = cam.scrollX + cam.width / 2;
            const centerY = cam.scrollY + cam.height / 2;
            this.controlMenu.setPosition(centerX, centerY);
        }
    }

    checkExit() {
        if (!this.player || !this.ship) return;

        // Find entrance room
        const entranceRoom = this.ship.rooms.find(r => r.type === 'entrance');
        if (entranceRoom) {
            // Simple AABB check
            const playerBounds = this.player.sprite.getBounds();

            // Check all tiles in entrance room
            for (const s of entranceRoom.sprites) {
                const tileBounds = s.sprite.getBounds();
                if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, tileBounds)) {
                    console.log("Player exiting ship...");
                    this.scene.start('SpaceExploration');
                    break;
                }
            }
        }
    }

    handleInteraction(player) {
        if (this.ship) {
            // FIX: Player class wraps sprite, so access coordinates via .sprite
            const result = this.ship.handleInteraction(player.sprite.x, player.sprite.y);

            // Process result
            if (result && result.type === 'pilotSeat') {
                // Toggle pilot seat
                const isActive = this.ship.togglePilotSeat();

                // Update player seated state
                player.setSeat(isActive);

                // Show/hide control menu
                if (isActive) {
                    this.showControlMenu();
                } else {
                    this.hideControlMenu();
                }
            }
        }
    }

    showControlMenu() {
        if (this.controlMenu) return; // Already showing

        // Get camera center in world coordinates
        const cam = this.cameras.main;
        const centerX = cam.scrollX + cam.width / 2;
        const centerY = cam.scrollY + cam.height / 2;

        // Create container
        this.controlMenu = this.add.container(centerX, centerY);
        this.controlMenu.setDepth(1000);
        this.controlMenu.setScrollFactor(1); // Follow camera

        // Background
        const bg = this.add.rectangle(0, 0, 300, 250, 0x000000, 0.85);
        bg.setStrokeStyle(2, 0x00ff88);
        this.controlMenu.add(bg);

        // Title
        const title = this.add.text(0, -100, 'Ship Controls', {
            font: '20px Arial',
            fill: '#00ff88'
        }).setOrigin(0.5);
        this.controlMenu.add(title);

        // O2 Status
        this.o2StatusText = this.add.text(0, -60, 'O2: 0%', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.controlMenu.add(this.o2StatusText);

        // Venting Button
        const ventBg = this.add.rectangle(0, -20, 250, 40, 0x333333);
        ventBg.setStrokeStyle(2, 0xff0000);
        ventBg.setInteractive();
        this.controlMenu.add(ventBg);

        this.ventButtonText = this.add.text(0, -20, 'Venting: OFF', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.controlMenu.add(this.ventButtonText);

        ventBg.on('pointerdown', () => {
            this.ship.isVenting = !this.ship.isVenting;
            this.updateControlMenu();
        });

        // Oxygen Generator Button
        const oxyBg = this.add.rectangle(0, 30, 250, 40, 0x333333);
        oxyBg.setStrokeStyle(2, 0x00ff00);
        oxyBg.setInteractive();
        this.controlMenu.add(oxyBg);

        this.oxyButtonText = this.add.text(0, 30, 'O2 Generator: ON', {
            font: '16px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.controlMenu.add(this.oxyButtonText);

        oxyBg.on('pointerdown', () => {
            this.ship.systems.oxygen.isActive = !this.ship.systems.oxygen.isActive;
            this.updateControlMenu();
        });

        // Exit Button
        const exitBg = this.add.rectangle(0, 90, 150, 35, 0x555555);
        exitBg.setStrokeStyle(2, 0xffffff);
        exitBg.setInteractive();
        this.controlMenu.add(exitBg);

        const exitText = this.add.text(0, 90, 'Exit (Space)', {
            font: '14px Arial',
            fill: '#ffffff'
        }).setOrigin(0.5);
        this.controlMenu.add(exitText);

        exitBg.on('pointerdown', () => {
            // Deactivate seat
            this.ship.togglePilotSeat();
            this.player.setSeat(false);
            this.hideControlMenu();
        });

        this.updateControlMenu();
    }

    hideControlMenu() {
        if (this.controlMenu) {
            this.controlMenu.destroy();
            this.controlMenu = null;
            this.o2StatusText = null;
            this.ventButtonText = null;
            this.oxyButtonText = null;
        }
    }

    updateControlMenu() {
        if (!this.controlMenu || !this.ship) return;

        // Update O2 status
        const avgO2 = Math.round(this.ship.getAverageOxygenLevel());
        this.o2StatusText.setText(`O2: ${avgO2}%`);

        // Update Venting button
        const ventStatus = this.ship.isVenting ? 'ON' : 'OFF';
        const ventColor = this.ship.isVenting ? '#ff0000' : '#ffffff';
        this.ventButtonText.setText(`Venting: ${ventStatus}`);
        this.ventButtonText.setColor(ventColor);

        // Update Oxygen Generator button
        const oxyStatus = this.ship.systems.oxygen.isActive ? 'ON' : 'OFF';
        const oxyColor = this.ship.systems.oxygen.isActive ? '#00ff00' : '#ffffff';
        this.oxyButtonText.setText(`O2 Generator: ${oxyStatus}`);
        this.oxyButtonText.setColor(oxyColor);
    }
}
