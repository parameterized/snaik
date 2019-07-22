
var ssx = 800, ssy = 600;

var game;
var timer = 0;
var stepsPerSecond = 12;

var control = 'user';
var socket;
var aiStateSent = false;
var preds = {right: 0, left: 0, up: 0, down: 0};

$(function() {
    $('#first_toggle').click(function() {
        control = 'user';
        stepsPerSecond = 12;
        timer = 0;
        aiStateSent = false;
    });
    $('#second_toggle').click(function() {
        control = 'program';
        stepsPerSecond = 120;
        timer = 0;
        aiStateSent = false;
    });
    $('#third_toggle').click(function() {
        control = 'ai';
        stepsPerSecond = 240;
        timer = 0;
        aiStateSent = false;
    });

    socket = io();
    socket.on('action', function(data) {
        if (data.id === game.id) {
            switch (data.dir) {
                case 'right':
                    game.snake.dir = game.sDirRight;
                    break;
                case 'left':
                    game.snake.dir = game.sDirLeft;
                    break;
                case 'up':
                    game.snake.dir = game.sDirUp;
                    break;
                case 'down':
                    game.snake.dir = game.sDirDown;
                    break;
            }
            game.step();
            timer += 1/stepsPerSecond;
            if (timer < 0 && !game.gameOver) {
                socket.emit('predict', game.getState());
            } else {
                aiStateSent = false;
            }
            preds = data.preds;
            $('#preds #right').text('Right: ' + parseFloat(preds.right).toFixed(2));
            $('#preds #left').text('Left: ' + parseFloat(preds.left).toFixed(2));
            $('#preds #up').text('Up: ' + parseFloat(preds.up).toFixed(2));
            $('#preds #down').text('Down: ' + parseFloat(preds.down).toFixed(2));
        }
    });
});

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

    game = new Game();
}

function update() {
    let dt = min(1/frameRate(), 1/4);
    timer -= dt;
    while (timer < 0 && !game.gameOver && !aiStateSent) {
        if (control === 'program') {
            if (game.inputQueue.length !== 0) {
                game.inputQueue = [];
            }
            let p1 = game.snake.body.slice(-1)[0];
            let grid = [];
            for (let i=0; i < 40; i++) {
                grid[i] = [];
                for (let j=0; j < 30; j++) {
                    grid[i][j] = false;
                }
            }
            for (let i in game.snake.body) {
                let v = game.snake.body[i];
                grid[v.x][v.y] = true;
            }
            let opts = [];
            if (p1.x + 1 >= 0 && p1.x + 1 < 40 && p1.y >= 0 && p1.y < 30 && !grid[p1.x + 1][p1.y]) {
                opts.push(game.sDirRight);
            }
            if (p1.x - 1 >= 0 && p1.x - 1 < 40 && p1.y >= 0 && p1.y < 30 && !grid[p1.x - 1][p1.y]) {
                opts.push(game.sDirLeft);
            }
            if (p1.x >= 0 && p1.x < 40 && p1.y - 1 >= 0 && p1.y - 1 < 30 && !grid[p1.x][p1.y - 1]) {
                opts.push(game.sDirUp);
            }
            if (p1.x >= 0 && p1.x < 40 && p1.y + 1 >= 0 && p1.y + 1 < 30 && !grid[p1.x][p1.y + 1]) {
                opts.push(game.sDirDown);
            }
            if (opts.length !== 0) {
                let dist = [];
                for (let i in opts) {
                    let v = opts[i];
                    dist.push(Math.pow(p1.x + v.x - game.apple.x, 2) + Math.pow(p1.y + v.y - game.apple.y, 2));
                }
                game.snake.dir = opts[dist.reduce((iMax, x, i, arr) => x < arr[iMax] ? i : iMax, 0)];
            }
        }
        if (control === 'user' || control === 'program') {
            game.step();
            timer += 1/stepsPerSecond;
        } else if (control === 'ai') {
            socket.emit('predict', game.getState());
            aiStateSent = true;
        }
    }
    if (control === 'ai' && game.gameOver && !aiStateSent) {
        socket.emit('gameOver', {id: game.id, timeout: false});
        aiStateSent = true;
    }
    if ((control === 'program' || control === 'ai') && game.gameOver && timer < -1/2) {
        game.gameOver = false;
        game.resetSnake();
        timer = 0;
        aiStateSent = false;
    }
    if (control === 'ai' && game.stepNum - game.lastScoreStep > 500) {
        socket.emit('gameOver', {id: game.id, timeout: true});
        game.resetSnake();
        timer = 0;
        aiStateSent = false;
    }
}

function keyPressed() {
    if (control === 'user') {
        let dir;
        switch (keyCode) {
            case 68: // d
            case 39: // right
                dir = game.sDirRight;
                break;
            case 65: // a
            case 37: // left
                dir = game.sDirLeft;
                break;
            case 87: // w
            case 38: // up
                dir = game.sDirUp;
                break;
            case 83: // s
            case 40: // down
                dir = game.sDirDown;
                break;
        }
        if (dir) {
            if (game.inputQueue.length === 0) {
                if (dir !== game.snake.dir) {
                    game.inputQueue[0] = dir;
                }
            } else if (dir !== game.inputQueue[0]) {
                game.inputQueue[1] = dir;
            }
            if (game.gameOver && timer < -1/stepsPerSecond) {
                game.gameOver = false;
                game.resetSnake();
                timer = 0;
            }
        }
    }
}

function draw() {
    update();
    background(170, 202, 155);
    noStroke();
    
    fill(82, 95, 76);
    rect(game.apple.x*20 + 1, game.apple.y*20 + 1, 18, 18);
    for (let i in game.snake.body) {
        let v = game.snake.body[i];
        rect(v.x*20 + 1, v.y*20 + 1, 18, 18);
    }

    fill(144, 170, 131);
    textSize(48);
    textAlign(RIGHT, CENTER);
    text(max(game.highscore, game.score), ssx/2 - 10, 56);
    fill(198, 234, 180);
    rect(ssx/2 - 3, 30, 6, 44);
    textAlign(LEFT, CENTER);
    text(game.score, ssx/2 + 10, 56);
}