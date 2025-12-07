export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Get reference to the game scene to access ship data
        this.gameScene = this.scene.get('ShipInterior');

        // Status Text
        this.statusText = this.add.text(10, 10, 'Systems: Oxygen[OK] Engines[OFF]', {
            font: '16px monospace', fill: '#0f0', backgroundColor: '#00000088', padding: { x: 5, y: 5 }
        });

        // Oxygen Vent Button
        this.ventBtn = this.add.text(10, 40, 'VENTING: OFF', {
            font: '16px monospace', fill: '#00ff00', backgroundColor: '#003300', padding: { x: 5, y: 5 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.gameScene && this.gameScene.ship) {
                    this.gameScene.ship.isVenting = !this.gameScene.ship.isVenting;
                    this.updateVentButton();
                }
            });

        // Oxygen System Button
        // Below Vent Button (y=40+30=70)
        this.oxyBtn = this.add.text(10, 75, 'OXY GEN: ON', {
            font: '16px monospace', fill: '#00ff00', backgroundColor: '#003300', padding: { x: 5, y: 5 }
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this.gameScene && this.gameScene.ship) {
                    const system = this.gameScene.ship.systems.oxygen;
                    system.isActive = !system.isActive;
                    this.updateOxyButton();
                }
            });

        // Oxygen Percentage Indicator
        this.o2Text = this.add.text(150, 40, 'O2: 100%', {
            font: '16px monospace', fill: '#00ffff', backgroundColor: '#000033', padding: { x: 5, y: 5 }
        });

        // HP Indicator (Non-clickable button style)
        this.hpText = this.add.text(150, 75, 'HP: 100', {
            font: '16px monospace', fill: '#ff0000', backgroundColor: '#330000', padding: { x: 5, y: 5 }
        });

        // Instructions
        this.add.text(10, 110, 'WASD to Move\nV to Vent\nO to Toggle Oxy', { font: '12px monospace', fill: '#aaa' });

        // Keybind for OXY Toggle
        this.input.keyboard.on('keydown-O', () => {
            if (this.gameScene && this.gameScene.ship) {
                const system = this.gameScene.ship.systems.oxygen;
                system.isActive = !system.isActive;
                this.updateOxyButton();
            }
        });
    }

    update(time, delta) {
        if (this.gameScene && this.gameScene.ship && this.gameScene.player) {

            // Update Vent Button Logic
            const isVenting = this.gameScene.ship.isVenting;
            const currentVentText = this.ventBtn.text;

            if (isVenting && currentVentText !== 'VENTING: ON') {
                this.updateVentButton();
            } else if (!isVenting && currentVentText !== 'VENTING: OFF') {
                this.updateVentButton();
            }

            // Update Oxy Button Logic
            const isOxyOn = this.gameScene.ship.systems.oxygen.isActive;
            const currentOxyText = this.oxyBtn.text;

            if (isOxyOn && currentOxyText !== 'OXY GEN: ON') {
                this.updateOxyButton();
            } else if (!isOxyOn && currentOxyText !== 'OXY GEN: OFF') {
                this.updateOxyButton();
            }

            // Update Oxygen Percentage
            const avgO2 = this.gameScene.ship.getAverageOxygenLevel();
            this.o2Text.setText(`O2: ${Math.round(avgO2)}%`);

            // Color shift for O2
            if (avgO2 < 20) this.o2Text.setStyle({ fill: '#ff0000' });
            else if (avgO2 < 50) this.o2Text.setStyle({ fill: '#ffff00' });
            else this.o2Text.setStyle({ fill: '#00ffff' });

            // Update HP
            const hp = Math.round(this.gameScene.player.health);
            this.hpText.setText(`HP: ${hp}`);
        }
    }

    updateVentButton() {
        if (!this.gameScene.ship) return;
        const isVenting = this.gameScene.ship.isVenting;

        this.ventBtn.setText(isVenting ? 'VENTING: ON' : 'VENTING: OFF');
        this.ventBtn.setStyle({
            fill: isVenting ? '#ff0000' : '#00ff00',
            backgroundColor: isVenting ? '#330000' : '#003300'
        });
    }

    updateOxyButton() {
        if (!this.gameScene.ship) return;
        const isOxyOn = this.gameScene.ship.systems.oxygen.isActive;

        this.oxyBtn.setText(isOxyOn ? 'OXY GEN: ON' : 'OXY GEN: OFF');
        this.oxyBtn.setStyle({
            fill: isOxyOn ? '#00ff00' : '#ff0000',
            backgroundColor: isOxyOn ? '#003300' : '#330000'
        });
    }
}
