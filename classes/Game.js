export class Game {
    constructor() {
        console.log("Game Manager Initialized");
        // This will hold global state not tied to a specific scene
        // like player inventory, ship persistence, save data
        this.state = {
            credits: 0,
            resources: {
                scrap: 0,
                fuel: 20,
                food: 10
            }
        };
    }
}
