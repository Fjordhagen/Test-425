
import { Ship } from './Ship.js';

export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = 150;
        this.o2ConsumptionRate = 15; // 15% per second
        this.health = 100;
        this.maxHealth = 100;
        this.isSeated = false; // Movement lock for pilot seat

        // Visuals (Placeholder Rectangle)
        this.sprite = scene.add.rectangle(x, y, 16, 24, 0xffff00);
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.pushable = false;

        this.inventory = []; // Legacy inventory cleared
        this.meleeAutoMode = false; // Auto-attack toggle
        this.meleeTimer = 0;
        this.rangedAutoMode = false;
        this.rangedTimer = 0;

        // Inventory Data
        this.equipment = {
            head: null,
            body: null,
            legs: null,
            handLeft: null,
            handRight: null,
            belt: [null, null, null]
        };
        this.backpack = [null, null, null, null, null, null]; // 6 slots
        this.inventoryVisible = false;
        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            e: Phaser.Input.Keyboard.KeyCodes.E, // Interact
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });

        // Mouse Input
        scene.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.rangedAutoMode = !this.rangedAutoMode;
                console.log(`Auto-Fire Toggled: ${this.rangedAutoMode}`);
                if (this.rangedAutoMode) {
                    this.performRangedAttack(pointer); // Fire immediately on toggle ON
                }
            } else if (pointer.leftButtonDown()) {
                if (!this.isSeated) {
                    this.meleeAutoMode = !this.meleeAutoMode;
                    console.log("Auto-Melee Mode:", this.meleeAutoMode ? "ON" : "OFF");
                }
            }
        });
    }

    performRangedAttack(pointer) {
        if (this.isSeated) return;

        // Check for Gun in Hands
        const hasGun = (this.equipment.handLeft && this.equipment.handLeft.type === 'gun') ||
            (this.equipment.handRight && this.equipment.handRight.type === 'gun');

        if (hasGun || this.inventory.includes('Weapon_range')) { // Keep legacy check for now or remove? User said "Remove ability".
            // Actually user said: "Hráči možnost střelby odeber. Střelba ... jen pokud bude mít entitu Gun".
            // So I should REMOVE 'Weapon_range' check or ensure inventory doesn't have it.
            // But wait, 'Weapon_range' string in inventory array was the old system.
            // New system uses this.equipment.
            // I will STRICTLY check equipment for Gun.
            if (hasGun) {
                // Calculate angle to mouse
                const targetX = pointer.worldX;
                const targetY = pointer.worldY;

                if (this.scene.handleRangedAttack) {
                    this.scene.handleRangedAttack(this, targetX, targetY);
                }
            } else {
                console.log("No Gun equipped in hands!");
            }
        }
    }

    addItem(itemData) {
        // Try to add to backpack first? Or just return success so Scene can decide?
        // User said: "Inventory slot for head body legs l-hand r-hand belt(3) backpack(6)".
        // When picking up, where does it go? Usually Backpack first, or Active Slot if empty.
        // Let's try Backpack first.
        for (let i = 0; i < this.backpack.length; i++) {
            if (this.backpack[i] === null) {
                this.backpack[i] = itemData;
                console.log(`Added ${itemData.label} to Backpack [${i}]`);
                return true;
            }
        }
        console.log("Inventory Full!");
        return false;
    }

    performMeleeAttack() {
        if (this.isSeated) return;

        // Visual "Punch" (Tween forward and back)
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 50,
            yoyo: true,
            onComplete: () => {
                this.sprite.setScale(1); // Reset
            }
        });

        // Reduced damage for auto-mode
        if (this.scene.handleMeleeAttack) {
            this.scene.handleMeleeAttack(this); // Scene handles damage (needs update there too to 1HP)
        }
    }

    update(time, delta) {
        if (this.isSeated) {
            this.body.setVelocity(0);
            return;
        }

        // Auto-Melee Logic
        if (this.meleeAutoMode) {
            this.meleeTimer += delta;
            if (this.meleeTimer >= 1000) {
                this.performMeleeAttack();
                this.meleeTimer = 0;
            }
        } else {
            this.meleeTimer = 0;
        }

        // Auto-Fire Logic
        if (this.rangedAutoMode) {
            this.rangedTimer += delta;
            // Slowed down by 75% -> 800ms delay (was 200ms)
            if (this.rangedTimer >= 800) {
                this.performRangedAttack(this.scene.input.activePointer);
                this.rangedTimer = 0;
            }
        } else {
            this.rangedTimer = 0;
        }

        const { left, right, up, down } = this.cursors;
        const { w, a, s, d, shift } = this.keys;

        // Apply speed modifier (Boost increased by 10% of total sprint speed: 1.25 * 1.10 = 1.375)
        const currentSpeed = shift.isDown ? this.speed * 1.375 : this.speed;

        this.body.setVelocity(0);

        // Horizontal
        if (left.isDown || a.isDown) {
            this.body.setVelocityX(-currentSpeed);
        } else if (right.isDown || d.isDown) {
            this.body.setVelocityX(currentSpeed);
        }

        // Vertical
        if (up.isDown || w.isDown) {
            this.body.setVelocityY(-currentSpeed);
        } else if (down.isDown || s.isDown) {
            this.body.setVelocityY(currentSpeed);
        }

        // Normalize for diagonal movement
        this.body.velocity.normalize().scale(currentSpeed);

        this.handleInteraction();
    }

    handleInteraction() {
        // Spacebar Interaction
        if (Phaser.Input.Keyboard.JustDown(this.keys.space)) {
            console.log("Player: Spacebar pressed!");
            // "Eligible interaction with anything"
            // Delegate logic to the Scene (which holds the Ship)
            if (this.scene.handleInteraction) {
                console.log("Player: Delegating to Scene.handleInteraction");
                this.scene.handleInteraction(this);
            } else {
                console.warn("Scene missing handleInteraction method.");
            }
        }
    }

    setSeat(seated) {
        this.isSeated = seated;
        console.log(`Player: Seated state set to ${seated}`);
    }
}
