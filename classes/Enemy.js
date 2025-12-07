export class Enemy {
    constructor(scene, x, y) {
        this.scene = scene;
        this.speed = 50;
        this.direction = new Phaser.Math.Vector2(1, 0); // Start moving right
        this.moveTimer = 0;

        // Visuals
        this.sprite = scene.add.rectangle(x, y, 20, 20, 0xff0000); // Red square
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;

        // Physics properties
        this.body.setCollideWorldBounds(true);
        this.body.setBounce(1);
        this.body.pushable = false; // Prevent player from pushing enemy

        this.health = 100;
        this.o2ConsumptionRate = 15; // Same as player
        this.isDead = false;
        this.attackCooldown = 0;
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;

        // Visual flash (White)
        this.sprite.setFillStyle(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (!this.isDead) this.sprite.setFillStyle(0xff0000); // Back to red
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.sprite.setAlpha(0.3); // Transparent
        this.body.enable = false;  // Disable physics interactions
        this.body.setVelocity(0, 0);
        console.log("Enemy Died.");
    }

    update(time, delta, player) {
        if (this.isDead) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        let isChasing = false;

        // Check for player aggro
        if (player && !player.isDead) { // Assume player has isDead or check health
            const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.sprite.x, player.sprite.y);

            // Aggro Range: 2 tiles (64px)
            if (dist < 64) {
                isChasing = true;

                if (dist > 32) { // Increased range to ensure attack triggers
                    // Chase
                    this.scene.physics.moveToObject(this.sprite, player.sprite, this.speed);
                } else {
                    // In range, stop and attack
                    this.body.setVelocity(0, 0);

                    if (this.attackCooldown <= 0) {
                        this.performAttack(player);
                    }
                }
            }
        }

        if (!isChasing) {
            // Simple wandering logic
            this.moveTimer += delta;

            // Change direction every 2 seconds
            if (this.moveTimer > 2000) {
                this.moveTimer = 0;
                this.changeDirection();
            }

            // Apply constant velocity based on direction
            this.body.setVelocity(
                this.direction.x * this.speed,
                this.direction.y * this.speed
            );
        }
    }

    performAttack(player) {
        console.log("Enemy Attacks!");
        // Deal damage
        player.health = Math.max(0, player.health - 5); // 5 DMG
        this.attackCooldown = 1500; // 1.5s cooldown

        // Visual Lunging/Color effect?
        this.sprite.setFillStyle(0xffff00); // Yellow flash
        this.scene.time.delayedCall(200, () => {
            if (!this.isDead) this.sprite.setFillStyle(0xff0000);
        });
    }

    changeDirection() {
        // Random direction: Up, Down, Left, or Right
        const directions = [
            new Phaser.Math.Vector2(0, -1),
            new Phaser.Math.Vector2(0, 1),
            new Phaser.Math.Vector2(-1, 0),
            new Phaser.Math.Vector2(1, 0)
        ];

        this.direction = Phaser.Math.RND.pick(directions);
    }

    destroy() {
        this.sprite.destroy();
    }
}
