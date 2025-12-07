import { MainMenu } from './scenes/MainMenu.js';
import { ShipInterior } from './scenes/ShipInterior.js';
import { SpaceExploration } from './scenes/SpaceExploration.js';
import { BattleScene } from './scenes/BattleScene.js';
import { UIScene } from './scenes/UIScene.js'; // Import UI Scene

import { Game } from './classes/Game.js'; // Global Game Manager

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#050510',
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: { y: 0 }
        }
    },
    scene: [
        MainMenu,
        ShipInterior,
        UIScene, // Add to scene list
        SpaceExploration,
        BattleScene
    ]
};

window.game = new Phaser.Game(config);
window.gameManager = new Game(); // Global non-phaser game logic
