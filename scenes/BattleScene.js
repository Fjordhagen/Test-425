export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    create() {
        this.add.text(20, 20, 'Combat Encounter', { font: '16px monospace', fill: '#f00' });
    }
}
