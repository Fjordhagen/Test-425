export class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null);

        this.scene = scene;
        this.speed = 400;
        this.damage = 10;
        this.lifeTime = 0;

        // Visuals
        if (!scene.textures.exists('bullet')) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xffff00, 1);
            graphics.fillRect(0, 0, 6, 6);
            graphics.generateTexture('bullet', 6, 6);
        }
        this.setTexture('bullet');
        this.setDepth(1000);

        // Add to scene and physics
        scene.add.existing(this);
        // Note: physics.add.existing is usually handled by group.add(), but since we use constructor call,
        // we might do it here or let the scene do it. Safest is to let scene/group handle body creation or ensure it.
        scene.physics.add.existing(this);
    }

    fire(angle) {
        const vx = Math.cos(angle) * this.speed;
        const vy = Math.sin(angle) * this.speed;
        this.setVelocity(vx, vy);
        console.log(`Bullet Fired. Vel: ${vx.toFixed(1)}, ${vy.toFixed(1)}`);
    }

    update(time, delta) {
        if (this.lifeTime < 10) {
            console.log(`Bullet Pos: ${this.x.toFixed(1)}, ${this.y.toFixed(1)} Vel: ${this.body.velocity.x.toFixed(1)}, ${this.body.velocity.y.toFixed(1)}`);
            this.lifeTime++;
        }
    }
}
