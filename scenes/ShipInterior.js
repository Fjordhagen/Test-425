import { Ship } from '../classes/Ship.js';
import { Player } from '../classes/Player.js';
import { Enemy } from '../classes/Enemy.js';
import { Bullet } from '../classes/Projectile.js';

export class ShipInterior extends Phaser.Scene {
    constructor() {
        super({ key: 'ShipInterior' });
        this.controlMenu = null; // UI container for pilot seat controls
        this.lowOxygenTimer = 0; // Timer for grace period before damage starts
        this.bedHealTimer = 0;   // Timer for bed healing
        this.enemyLowOxygenTimer = 0; // Timer for enemy suffocation
        this.isGameOver = false;
    }

    create() {
        // Initialize Ship Layout
        this.ship = new Ship(this, 30, 20);

        // Initialize Player
        // Spawn at Bed if available, otherwise default location (12,7)
        let playerX = 12 * 32;
        let playerY = 7 * 32;

        if (this.ship.bed) {
            playerX = (this.ship.bed.x * 32) + 16;
            playerY = (this.ship.bed.y * 32) + 16;
            console.log("Spawned at Bed!");
        }

        this.player = new Player(this, playerX, playerY);

        // Add Collision
        this.physics.world.TILE_BIAS = 32; // Fix tunneling
        this.physics.add.collider(this.player.sprite, this.ship.wallGroup);

        // Enemy
        this.enemy = new Enemy(this, 6 * 32 + 16, 7 * 32 + 16);
        this.physics.add.collider(this.enemy.sprite, this.ship.wallGroup);

        // Player-Enemy Collision (Damage)
        // Player-Enemy Collision (Damage) - Handled in Enemy.js now
        this.physics.add.collider(this.player.sprite, this.enemy.sprite);

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

        // Disable Default Context Menu (Right Click)
        this.input.mouse.disableContextMenu();

        // Custom Crosshair
        // Simple circle or cross
        this.crosshair = this.add.circle(0, 0, 4, 0x00ff00);
        this.crosshair.setStrokeStyle(1, 0x00ff00);
        this.crosshair.setDepth(100); // Overlay on top

        // Projectiles Group
        this.projectiles = this.physics.add.group({
            runChildUpdate: true
        });

        // Items Group
        this.items = this.add.group();

        // Spawn Gun at 15,8
        const gunX = 15 * 32 + 16;
        const gunY = 8 * 32 + 16;
        const gunItem = this.add.rectangle(gunX, gunY, 16, 8, 0xaaaaaa); // Grey rectangle gun
        gunItem.setStrokeStyle(1, 0x000000);
        gunItem.setData('itemData', { type: 'gun', label: 'E-11' });
        this.items.add(gunItem);

        // Add label?
        this.add.text(gunX, gunY - 10, 'Gun', { fontSize: '8px', fill: '#fff' }).setOrigin(0.5);
    }

    update(time, delta) {
        if (this.isGameOver) return;

        // Update Crosshair Position
        // Must convert screen pointer to world coordinates because camera follows player
        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
        if (this.crosshair) {
            this.crosshair.setPosition(worldPoint.x, worldPoint.y);
        }

        if (this.ship) this.ship.update(time, delta);
        if (this.player) {
            this.player.update(time, delta);

            // Check Player Death
            if (this.player.health <= 0) {
                this.gameOver();
                return;
            }

            if (this.enemy && !this.enemy.isDead) { // Check active state
                this.enemy.update(time, delta, this.player);

                // Enemy Oxygen Consumption
                if (this.enemy.o2ConsumptionRate) {
                    const eConsumption = this.enemy.o2ConsumptionRate * (delta / 1000);
                    this.ship.consumeOxygenAtPosition(this.enemy.sprite.x, this.enemy.sprite.y, eConsumption);
                }

                // Enemy Suffocation Logic
                const egx = Math.floor(this.enemy.sprite.x / 32);
                const egy = Math.floor(this.enemy.sprite.y / 32);
                let eLocalO2 = 0;

                if (egx >= 0 && egx < this.ship.width && egy >= 0 && egy < this.ship.height) {
                    eLocalO2 = this.ship.o2Grid[egy][egx];
                }

                if (eLocalO2 < 10) {
                    this.enemyLowOxygenTimer += (delta / 1000);
                    // Shorter grace period for enemy (e.g. 10s) to demonstrate mechanic
                    if (this.enemyLowOxygenTimer >= 10) {
                        const damage = 5 * (delta / 1000);
                        this.enemy.takeDamage(damage);
                    }
                } else {
                    this.enemyLowOxygenTimer = 0;
                }
            } else if (this.enemy && this.enemy.isDead) {
                // Nothing (dead)
            }

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
            }

            // Bed Healing Logic (1 HP per 3 seconds)
            if (this.ship.bed) {
                const bedX = (this.ship.bed.x * 32) + 16;
                const bedY = (this.ship.bed.y * 32) + 16;
                const distToBed = Phaser.Math.Distance.Between(this.player.sprite.x, this.player.sprite.y, bedX, bedY);

                if (distToBed < 24) { // Standing on bed
                    this.bedHealTimer += delta;
                    if (this.bedHealTimer >= 3000) {
                        this.player.health = Math.min(this.player.maxHealth, this.player.health + 1);
                        this.bedHealTimer -= 3000;
                        console.log("Healed at Bed! HP:", Math.floor(this.player.health));
                    }
                } else {
                    this.bedHealTimer = 0; // Reset if stepped off
                }
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

        // Check for Item Pickup
        if (this.items) {
            this.items.getChildren().forEach(item => {
                if (item.active) {
                    const dist = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, item.x, item.y);
                    if (dist < 32) {
                        const itemData = item.getData('itemData');
                        const success = player.addItem(itemData);
                        if (success) {
                            item.destroy(); // Remove from world
                        }
                    }
                }
            });
        }
    }

    handleMeleeAttack(player) {
        if (this.enemy && !this.enemy.isDead) {
            // Check distance
            const dist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y,
                this.enemy.sprite.x, this.enemy.sprite.y
            );

            // Melee Range ~40-50px
            if (dist < 50) {
                console.log("Melee Hit!");
                this.enemy.takeDamage(1); // Reduced from 3 to 1 for auto-mode

                // Knockback?
                const angle = Phaser.Math.Angle.Between(
                    player.sprite.x, player.sprite.y,
                    this.enemy.sprite.x, this.enemy.sprite.y
                );

                this.enemy.body.setVelocity(
                    Math.cos(angle) * 100,
                    Math.sin(angle) * 100
                );
            } else {
                console.log("Melee Miss (Dist: " + dist.toFixed(1) + ")");
            }
        }
    }

    handleRangedAttack(player, targetX, targetY) {
        // Calculate angle
        const angle = Phaser.Math.Angle.Between(
            player.sprite.x, player.sprite.y,
            targetX, targetY
        );

        // Spawn projectile
        // Offset: Reduced to 16px (approx edge of player 32x32)
        // Since bullets don't collide with player, this avoids spawning inside adjacent walls.
        const spawnX = player.sprite.x + Math.cos(angle) * 16;
        const spawnY = player.sprite.y + Math.sin(angle) * 16;

        const bullet = new Bullet(this, spawnX, spawnY);

        // Add to projectiles group (if not exists)
        if (!this.projectiles) {
            this.projectiles = this.physics.add.group({
                runChildUpdate: true
            });
        }
        this.projectiles.add(bullet);

        // Fire AFTER adding to group to ensure physics body is stable
        bullet.fire(angle);

        // Add collision with walls
        this.physics.add.collider(bullet, this.ship.wallGroup, (bSprite, wall) => {
            console.log("Bullet hit wall! Destroying.");
            bSprite.destroy();
        });

        // Add collision with Enemy
        if (this.enemy && !this.enemy.isDead) {
            this.physics.add.overlap(bullet, this.enemy.sprite, (bSprite, eSprite) => {
                bSprite.destroy();
                this.enemy.takeDamage(10);
                console.log("Ranged Hit! Enemy Health:", this.enemy.health);
            });
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
    gameOver() {
        this.isGameOver = true;
        if (this.player && this.player.body) {
            this.player.body.setVelocity(0);
        }
        console.log("GAME OVER");

        const cam = this.cameras.main;
        const centerX = cam.width / 2;
        const centerY = cam.height / 2;

        this.add.text(centerX, centerY, 'GAME OVER', {
            fontSize: '64px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 6,
            fontFamily: 'monospace'
        })
            .setOrigin(0.5)
            .setScrollFactor(0) // Fix to screen
            .setDepth(2000);
    }
}
