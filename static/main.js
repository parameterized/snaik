
$(function() {
    var socket = io();
    $('#testBtn').click(function() {
        socket.emit('test', 'test');
    });
    socket.on('test2', function(data) {
        alert('test2');
    });
});

var ssx = 800, ssy = 600;

var sDirRight = {x: 1, y: 0};
var sDirLeft = {x: -1, y: 0};
var sDirUp = {x: 0, y: -1};
var sDirDown = {x: 0, y: 1};
var sBodyBase = [{x: 19, y: 15}, {x: 20, y: 15}, {x: 21, y: 15}];
var snake = {
    body: sBodyBase.slice(0),
    dir: sDirRight
};

var apple;
function setApple() {
    let grid = [];
    for (let i=0; i < 40; i++) {
        grid[i] = [];
        for (let j=0; j < 30; j++) {
            grid[i][j] = true;
        }
    }
    for (let i in snake.body) {
        let v = snake.body[i];
        grid[v.x][v.y] = false;
    }
    let free = [];
    for (let i=0; i < 40; i++) {
        for (let j=0; j < 30; j++) {
            if (grid[i][j]) {
                free.push({x: i, y: j});
            }
        }
    }
    apple = free[Math.floor(Math.random()*free.length)];
}
setApple();

var timer = 0;
var inputQueue = [];

var score = 0;
var highscore = 0;
var gameOver = false;

function setup() {
    let canvas = createCanvas(ssx, ssy);
    canvas.parent('sketch');
    let $canvas = $('canvas');
    $canvas.bind('contextmenu', function(e) {
        return false;
    });
    $canvas.bind('mousedown', function(e) {
        if (e.detail > 1 || e.which === 2) {
            e.preventDefault();
        }
    });
    $(document).bind('keydown', function(e) {
        if (e.keyCode === 9) { // tab
            e.preventDefault();
        }
    });
    strokeJoin(ROUND);
}

function resetSnake() {
    snake = {
        body: sBodyBase.slice(0),
        dir: sDirRight
    };
    setApple();
    inputQueue = [];
    highscore = max(highscore, score);
    score = 0;
}

function update() {
    let dt = min(1/frameRate(), 1/4);
    timer -= dt;
    if (timer < 0 && !gameOver) {
        timer = max(timer + 1/12, 0);
        let p1 = snake.body.slice(-1)[0];
        if (inputQueue.length !== 0) {
            let dir = inputQueue.shift();
            let p2 = snake.body.slice(-2, -1)[0];
            if (snake.body.length === 1 || (p1.x + dir.x !== p2.x && p1.y + dir.y !== p2.y)) {
                snake.dir = dir;
            }
        }
        let x = p1.x + snake.dir.x;
        let y = p1.y + snake.dir.y;
        if (x === apple.x && y === apple.y) {
            snake.body.push({x: x, y: y});
            score += 1;
            setApple();
        } else {
            if (snake.body.filter(seg => (seg.x === x && seg.y === y)).length !== 0) {
                gameOver = true;
            } else {
                snake.body.push({x: x, y: y});
                if (x < 0 || x >= 40 || y < 0 || y >= 30) {
                    gameOver = true;
                }
            }
            if (!gameOver) {
                snake.body.shift();
            }
        }
    }
}

function keyPressed() {
    let dir;
    switch (keyCode) {
        case 68: // d
        case 39: // right
            dir = sDirRight;
            break;
        case 65: // a
        case 37: // left
            dir = sDirLeft;
            break;
        case 87: // w
        case 38: // up
            dir = sDirUp;
            break;
        case 83: // s
        case 40: // down
            dir = sDirDown;
            break;
    }
    if (dir) {
        if (inputQueue.length === 0) {
            if (dir !== snake.dir) {
                inputQueue[0] = dir;
            }
        } else if (dir !== inputQueue[0]) {
            inputQueue[1] = dir;
        }
        if (gameOver && timer < -1/12) {
            gameOver = false;
            resetSnake();
            timer = 0;
        }
    }
}

function draw() {
    update();
    background(170, 202, 155);
    noStroke();
    
    fill(82, 95, 76);
    rect(apple.x*20 + 1, apple.y*20 + 1, 18, 18);
    for (let i in snake.body) {
        let v = snake.body[i];
        rect(v.x*20 + 1, v.y*20 + 1, 18, 18);
    }

    fill(144, 170, 131);
    textSize(48);
    textAlign(RIGHT, CENTER);
    text(max(highscore, score), ssx/2 - 10, 56);
    fill(198, 234, 180);
    rect(ssx/2 - 3, 30, 6, 44);
    textAlign(LEFT, CENTER);
    text(score, ssx/2 + 10, 56);
}