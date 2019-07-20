

function Game() {
    this.sDirRight = {x: 1, y: 0};
    this.sDirLeft = {x: -1, y: 0};
    this.sDirUp = {x: 0, y: -1};
    this.sDirDown = {x: 0, y: 1};
    this.sBodyBase = [{x: 19, y: 15}, {x: 20, y: 15}, {x: 21, y: 15}];
    this.snake = {
        body: this.sBodyBase.slice(0),
        dir: this.sDirRight
    };
    this.setApple();
    this.inputQueue = [];
    this.score = 0;
    this.highscore = 0;
    this.gameover = false;
    this.stepNum = 0;
}

Game.prototype.setApple = function() {
    let grid = [];
    for (let i=0; i < 40; i++) {
        grid[i] = [];
        for (let j=0; j < 30; j++) {
            grid[i][j] = false;
        }
    }
    for (let i in this.snake.body) {
        let v = this.snake.body[i];
        grid[v.x][v.y] = true;
    }
    let free = [];
    for (let i=0; i < 40; i++) {
        for (let j=0; j < 30; j++) {
            if (!grid[i][j]) {
                free.push({x: i, y: j});
            }
        }
    }
    this.apple = free[Math.floor(Math.random()*free.length)];
}

Game.prototype.resetSnake = function() {
    this.snake = {
        body: this.sBodyBase.slice(0),
        dir: this.sDirRight
    };
    this.setApple();
    this.inputQueue = [];
    this.highscore = max(this.highscore, this.score);
    this.score = 0;
    this.stepNum = 0;
}

Game.prototype.step = function() {
    let p1 = this.snake.body.slice(-1)[0];
    if (this.inputQueue.length !== 0) {
        let dir = this.inputQueue.shift();
        let p2 = this.snake.body.slice(-2, -1)[0];
        if (this.snake.body.length === 1 || (p1.x + dir.x !== p2.x && p1.y + dir.y !== p2.y)) {
            this.snake.dir = dir;
        }
    }
    let x = p1.x + this.snake.dir.x;
    let y = p1.y + this.snake.dir.y;
    if (x === this.apple.x && y === this.apple.y) {
        this.snake.body.push({x: x, y: y});
        this.score += 1;
        this.setApple();
    } else {
        if (this.snake.body.filter(seg => (seg.x === x && seg.y === y)).length !== 0) {
            this.gameOver = true;
        } else {
            this.snake.body.push({x: x, y: y});
            if (x < 0 || x >= 40 || y < 0 || y >= 30) {
                this.gameOver = true;
            }
        }
        if (!this.gameOver) {
            this.snake.body.shift();
        }
    }
    this.stepNum += 1;
}