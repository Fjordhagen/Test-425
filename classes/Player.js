export class Player {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = 150;
        this.o2ConsumptionRate = 15; // 15% per second
        this.health = 100;
        this.maxHealth = 100;
        this.isSeated = false; // Movement lock for pilot seat

        // Visuals (Placeholder Rectangle)
        // In real asset pipeline: this.sprite = scene.add.sprite(x, y, 'player');
        this.sprite = scene.add.rectangle(x, y, 16, 24, 0xffff00);
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;

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
    }

    update(time, delta) {
        this.handleMovement();
        this.handleInteraction();
    }

    handleMovement() {
        // If seated, prevent all movement
        if (this.isSeated) {
            this.body.setVelocity(0);
            return;
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
