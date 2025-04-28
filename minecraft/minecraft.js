// Minecraft-like implementation in JavaScript
// Simple voxel-based game inspired by Minecraft

class MinecraftGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.player = {
            x: this.width / 2,
            y: this.height / 2,
            size: 20,
            speed: 5,
            inventory: {
                dirt: 0,
                stone: 0,
                wood: 0,
                coffee: 0
            }
        };
        
        // World generation
        this.blockSize = 40;
        this.blocks = [];
        this.blockTypes = {
            dirt: '#8B4513',
            stone: '#808080',
            wood: '#A0522D',
            coffee: '#4A2C2A'
        };
        
        // Controls
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false
        };
        
        this.init();
    }
    
    init() {
        // Generate world
        this.generateWorld();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start game loop
        this.gameLoop();
    }
    
    generateWorld() {
        // Create a simple flat world with random blocks
        const rows = Math.ceil(this.height / this.blockSize);
        const cols = Math.ceil(this.width / this.blockSize);
        
        // Generate ground level
        const groundLevel = rows - 3;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip blocks above ground level
                if (row < groundLevel) continue;
                
                let blockType;
                const rand = Math.random();
                
                if (row === groundLevel) {
                    // Top layer is mostly dirt with some coffee
                    blockType = rand < 0.9 ? 'dirt' : 'coffee';
                } else if (row === groundLevel + 1) {
                    // Second layer is dirt and stone
                    blockType = rand < 0.6 ? 'dirt' : 'stone';
                } else {
                    // Bottom layer is mostly stone
                    blockType = rand < 0.2 ? 'dirt' : 'stone';
                }
                
                // Add trees occasionally on the surface
                if (row === groundLevel && rand > 0.95) {
                    this.blocks.push({
                        x: col * this.blockSize,
                        y: (groundLevel - 1) * this.blockSize,
                        type: 'wood'
                    });
                    
                    this.blocks.push({
                        x: col * this.blockSize,
                        y: (groundLevel - 2) * this.blockSize,
                        type: 'wood'
                    });
                }
                
                this.blocks.push({
                    x: col * this.blockSize,
                    y: row * this.blockSize,
                    type: blockType
                });
            }
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 's':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.keys.right = true;
                    break;
                case ' ':
                    this.keys.space = true;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 's':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.keys.right = false;
                    break;
                case ' ':
                    this.keys.space = false;
                    this.mineBlock();
                    break;
            }
        });
        
        // Mouse controls for mining/placing blocks
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Check if we're clicking on a block
            const clickedBlock = this.blocks.find(block => 
                mouseX >= block.x && mouseX < block.x + this.blockSize &&
                mouseY >= block.y && mouseY < block.y + this.blockSize
            );
            
            if (clickedBlock) {
                // Mine the block
                this.player.inventory[clickedBlock.type]++;
                this.blocks = this.blocks.filter(block => block !== clickedBlock);
                
                // Update inventory display
                this.updateInventoryDisplay();
            } else {
                // Place a block if we have one in inventory
                const blockX = Math.floor(mouseX / this.blockSize) * this.blockSize;
                const blockY = Math.floor(mouseY / this.blockSize) * this.blockSize;
                
                // Determine which block type to place based on inventory
                let blockToPlace = null;
                for (const type in this.player.inventory) {
                    if (this.player.inventory[type] > 0) {
                        blockToPlace = type;
                        break;
                    }
                }
                
                if (blockToPlace) {
                    this.blocks.push({
                        x: blockX,
                        y: blockY,
                        type: blockToPlace
                    });
                    
                    this.player.inventory[blockToPlace]--;
                    this.updateInventoryDisplay();
                }
            }
        });
    }
    
    mineBlock() {
        // Mine a block in front of the player
        const playerCenterX = this.player.x + this.player.size / 2;
        const playerCenterY = this.player.y + this.player.size / 2;
        
        // Find the closest block
        let closestBlock = null;
        let closestDistance = Infinity;
        
        for (const block of this.blocks) {
            const blockCenterX = block.x + this.blockSize / 2;
            const blockCenterY = block.y + this.blockSize / 2;
            
            const distance = Math.sqrt(
                Math.pow(blockCenterX - playerCenterX, 2) +
                Math.pow(blockCenterY - playerCenterY, 2)
            );
            
            if (distance < closestDistance && distance < this.blockSize * 1.5) {
                closestBlock = block;
                closestDistance = distance;
            }
        }
        
        if (closestBlock) {
            // Mine the block
            this.player.inventory[closestBlock.type]++;
            this.blocks = this.blocks.filter(block => block !== closestBlock);
            
            // Update inventory display
            this.updateInventoryDisplay();
        }
    }
    
    updateInventoryDisplay() {
        const inventoryElement = document.getElementById('minecraft-inventory');
        if (inventoryElement) {
            inventoryElement.innerHTML = `
                <div>Inventory:</div>
                <div>Dirt: ${this.player.inventory.dirt}</div>
                <div>Stone: ${this.player.inventory.stone}</div>
                <div>Wood: ${this.player.inventory.wood}</div>
                <div>Coffee: ${this.player.inventory.coffee}</div>
            `;
        }
    }
    
    update() {
        // Update player position based on keys
        if (this.keys.up) this.player.y -= this.player.speed;
        if (this.keys.down) this.player.y += this.player.speed;
        if (this.keys.left) this.player.x -= this.player.speed;
        if (this.keys.right) this.player.x += this.player.speed;
        
        // Keep player within bounds
        this.player.x = Math.max(0, Math.min(this.width - this.player.size, this.player.x));
        this.player.y = Math.max(0, Math.min(this.height - this.player.size, this.player.y));
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB'; // Sky blue
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw blocks
        for (const block of this.blocks) {
            this.ctx.fillStyle = this.blockTypes[block.type];
            this.ctx.fillRect(block.x, block.y, this.blockSize, this.blockSize);
            
            // Draw block outline
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(block.x, block.y, this.blockSize, this.blockSize);
        }
        
        // Draw player
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.size, this.player.size);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    // Check if the canvas exists
    if (document.getElementById('minecraft-canvas')) {
        const game = new MinecraftGame('minecraft-canvas');
    }
});
