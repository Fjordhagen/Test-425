export class ShipSystem {
    constructor(name, maxPower, currentPower = 0) {
        this.name = name;
        this.maxPower = maxPower;
        this.currentPower = currentPower;
        this.health = 100;
        this.isActive = true;
    }

    damage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isActive = false;
        }
    }

    repair(amount) {
        this.health = Math.min(100, this.health + amount);
        if (this.health > 0) {
            this.isActive = true;
        }
    }

    setPower(level) {
        this.currentPower = Math.min(this.maxPower, Math.max(0, level));
    }
}

export class OxygenSystem extends ShipSystem {
    constructor() {
        super('Oxygen', 3, 1);
        this.productionRate = 5; // Oxygen per tick
    }
}

export class EnginesSystem extends ShipSystem {
    constructor() {
        super('Engines', 5, 0);
        this.evasion = 0;
    }

    update() {
        this.evasion = this.currentPower * 5; // 5% evasion per power
    }
}

export class ShieldsSystem extends ShipSystem {
    constructor() {
        super('Shields', 4, 0);
        this.shieldLayers = 0;
        this.charge = 0;
    }
}
