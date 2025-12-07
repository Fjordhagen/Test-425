export class MainMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenu' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 3, 'SPACE FARM RPG', {
            font: '48px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const startButton = this.add.text(width / 2, height / 2, 'START GAME', {
            font: '24px monospace',
            fill: '#00ff00',
            backgroundColor: '#111'
        })
            .setPadding(10)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        startButton.on('pointerdown', () => {
            this.scene.start('ShipInterior');
        });

        startButton.on('pointerover', () => startButton.setStyle({ fill: '#fff', backgroundColor: '#0f0' }));
        startButton.on('pointerout', () => startButton.setStyle({ fill: '#0f0', backgroundColor: '#111' }));
    }
}
