export class SpaceExploration extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceExploration' });
    }

    create() {
        this.add.text(20, 20, 'Space Exploration Mode', { font: '16px monospace', fill: '#ff0' });

        this.input.keyboard.on('keydown-I', () => {
            this.scene.start('ShipInterior');
        });
    }
}
