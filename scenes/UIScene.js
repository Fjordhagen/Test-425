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

        // Version Text (Bottom Right)
        const { width, height } = this.scale;
        this.add.text(width - 10, height - 10, 'v 0.1', {
            font: '14px monospace',
            fill: '#ffffff55'
        }).setOrigin(1, 1); // Anchor bottom-right

        this.createInventoryUI();

        // Keybind for Inventory 'E'
        this.input.keyboard.on('keydown-E', () => {
            this.toggleInventory();
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

            // Ensure visual sync if visible (every few frames? or event based?)
            // Just update visuals in toggle for now, or drag-end.
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

    createInventoryUI() {
        // Container on the right side
        const { width, height } = this.scale;
        const panelWidth = 250;
        const panelHeight = 400;
        const x = width - panelWidth - 20;
        const y = 20;

        this.inventoryContainer = this.add.container(x, y);
        this.inventoryContainer.setVisible(false);

        // Background
        const bg = this.add.rectangle(panelWidth / 2, panelHeight / 2, panelWidth, panelHeight, 0x000000, 0.8);
        bg.setStrokeStyle(2, 0x00ff00);
        this.inventoryContainer.add(bg);

        // Title
        const title = this.add.text(panelWidth / 2, 20, 'INVENTORY', {
            font: '20px monospace', fill: '#00ff00'
        }).setOrigin(0.5);
        this.inventoryContainer.add(title);

        // Slots Configuration
        const cx = panelWidth / 2;
        const startY = 60;
        const gap = 50;
        const slotSize = 40;

        // Helper to add slot
        const addSlot = (sx, sy, label, type, index = null) => {
            const box = this.add.rectangle(sx, sy, slotSize, slotSize, 0x222222).setStrokeStyle(1, 0x00ff00);
            box.setInteractive({ dropZone: true });
            box.setData('slotInfo', { type, index }); // Store slot info for dropping

            const text = this.add.text(sx, sy, label, { font: '10px monospace', fill: '#aaa' }).setOrigin(0.5);
            this.inventoryContainer.add([box, text]);
            return { box, text, type, index, x: sx, y: sy };
        };

        this.uiSlots = []; // Array of slot data

        // Head
        this.uiSlots.push(addSlot(cx, startY, 'HEAD', 'head'));

        // Body (Chest)
        this.uiSlots.push(addSlot(cx, startY + gap, 'BODY', 'body'));

        // Legs
        this.uiSlots.push(addSlot(cx, startY + gap * 2, 'LEGS', 'legs'));

        // Left Hand
        this.uiSlots.push(addSlot(cx - gap, startY + gap, 'HAND(L)', 'handLeft'));

        // Right Hand
        this.uiSlots.push(addSlot(cx + gap, startY + gap, 'HAND(R)', 'handRight'));

        // Belt (3 slots)
        const beltY = startY + gap * 3;
        const beltGap = 45;
        for (let i = 0; i < 3; i++) {
            const bx = cx + (i - 1) * beltGap;
            this.uiSlots.push(addSlot(bx, beltY, `B${i + 1}`, 'belt', i));
        }

        // Backpack (6 slots)
        const packY = beltY + gap + 10;
        const packGap = 45;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 3; c++) {
                const px = cx + (c - 1) * packGap;
                const py = packY + r * packGap;
                const idx = r * 3 + c;
                this.uiSlots.push(addSlot(px, py, `PK${idx + 1}`, 'backpack', idx));
            }
        }

        // Item Visuals Group (to clear on redraw)
        this.itemVisuals = this.add.group();

        // Global Input Events for Drag
        this.input.on('dragstart', (pointer, gameObject) => {
            if (this.inventoryContainer && this.inventoryContainer.visible) {
                // this.children.bringToTop(gameObject);
            }
            gameObject.setData('originX', gameObject.x);
            gameObject.setData('originY', gameObject.y);
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            if (this.inventoryContainer && this.inventoryContainer.visible) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            const slotInfo = dropZone.getData('slotInfo');
            const itemData = gameObject.getData('itemData');
            const originSlot = gameObject.getData('originSlot');

            console.log("Dropped", itemData.label, "on", slotInfo.type, slotInfo.index);

            // Validate and Move Logic handled by Scene method
            this.handleItemDrop(itemData, originSlot, slotInfo);

            // Update all visuals
            this.updateInventoryVisuals();
        });

        this.input.on('dragend', (pointer, gameObject, dropped) => {
            if (!dropped) {
                gameObject.x = gameObject.getData('originX');
                gameObject.y = gameObject.getData('originY');
            }
        });
    }

    handleItemDrop(itemData, origin, target) {
        if (!this.gameScene || !this.gameScene.player) return;
        const player = this.gameScene.player;

        // Get source item reference
        let sourceItem = null;
        if (origin.type === 'backpack') sourceItem = player.backpack[origin.index];
        else if (origin.type === 'belt') sourceItem = player.equipment.belt[origin.index];
        else sourceItem = player.equipment[origin.type];

        if (!sourceItem) return; // Phantom drag?

        // Target Validation
        // User Rule: "Gun ... forbid slots head body legs"
        if (sourceItem.type === 'gun') {
            if (['head', 'body', 'legs'].includes(target.type)) {
                console.log("Cannot equip Gun to Armor slot!");
                return;
            }
        }

        // Move Logic (Swap)
        // 1. Remove from Origin
        if (origin.type === 'backpack') player.backpack[origin.index] = null;
        else if (origin.type === 'belt') player.equipment.belt[origin.index] = null;
        else player.equipment[origin.type] = null;

        // 2. Check Target content (Swap)
        let targetItem = null;
        if (target.type === 'backpack') targetItem = player.backpack[target.index];
        else if (target.type === 'belt') targetItem = player.equipment.belt[target.index];
        else targetItem = player.equipment[target.type];

        // 3. Place Source in Target
        if (target.type === 'backpack') player.backpack[target.index] = sourceItem;
        else if (target.type === 'belt') player.equipment.belt[target.index] = sourceItem;
        else player.equipment[target.type] = sourceItem;

        // 4. Place Target in Origin (if existed)
        if (targetItem) {
            if (origin.type === 'backpack') player.backpack[origin.index] = targetItem;
            else if (origin.type === 'belt') player.equipment.belt[origin.index] = targetItem;
            else player.equipment[origin.type] = targetItem;
        }

        console.log("Item moved.");
    }

    updateInventoryVisuals() {
        if (!this.gameScene || !this.gameScene.player || !this.inventoryContainer.visible) return;

        // Clear existing visuals
        this.itemVisuals.clear(true, true);

        const player = this.gameScene.player;

        this.uiSlots.forEach(slot => {
            let item = null;
            if (slot.type === 'backpack') item = player.backpack[slot.index];
            else if (slot.type === 'belt') item = player.equipment.belt[slot.index];
            else item = player.equipment[slot.type];

            if (item) {
                const itemSprite = this.add.rectangle(0, 0, 30, 30, 0x0088ff);
                itemSprite.setStrokeStyle(1, 0xffffff);
                itemSprite.setInteractive({ draggable: true });
                itemSprite.setData('itemData', item);
                itemSprite.setData('originSlot', { type: slot.type, index: slot.index });

                const label = this.add.text(0, 0, item.label || '?', { fontSize: '8px', fill: '#fff' }).setOrigin(0.5);

                // Add sprite to the Main Inventory Container and set pos
                itemSprite.x = slot.x;
                itemSprite.y = slot.y;
                label.x = slot.x;
                label.y = slot.y;

                this.inventoryContainer.add([itemSprite, label]);
                this.itemVisuals.add(itemSprite); // Track for clearing
                this.itemVisuals.add(label);
            }
        });
    }

    toggleInventory() {
        if (!this.inventoryContainer) return;

        const isVisible = !this.inventoryContainer.visible;
        this.inventoryContainer.setVisible(isVisible);

        if (isVisible) {
            this.updateInventoryVisuals();
        }

        if (this.gameScene && this.gameScene.player) {
            this.gameScene.player.inventoryVisible = isVisible;
        }
    }
}
