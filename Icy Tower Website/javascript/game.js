const url_to_font_name = '../fonts/charybdis.regular.ttf'
const font_name = new FontFace('charybdis', `url(${url_to_font_name})`);
document.fonts.add(font_name);

// get canvas and context
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// configure canvas
canvas.width = 1024;
canvas.height = 576;

// limits for the play area
var leftBorder = 150;
var rightBorder = canvas.width - 150;

// floor variables
var floorsToGenerate = 7;
var floorHeight = 20;

// text variables
var playerName = "";
var scoreCount = 0;
var powerCollected = 0;

let player = null; // placeholder for character class
let floors = null; // placeholder for array of floors

// states of the game
const MENU = "menu";
const GAMEPLAY = "play";
const SETTINGS = "settings";
const ENDGAME = "gameover";
var gameState = MENU; // initial state, changes as buttons are pressed

// object to hold the difficulty settings
const difficulty = {
    playerGravity: 0.1,
    playerSpeed: 3,
    playerJumpLimit: 5,
    playerPowerJump: 7,
    floorMinWidth: 100,
    floorMaxWidth: 150,
    floorFallSpeed: 0.5,
    floorIncreaseMin: 25,
    floorIncreaseMax: 30,
    fallSpeedLimit: 1,
};

// difficulties
const EASY = "Easy";
const MEDIUM = "Medium";
const HARD = "Hard";
const arrayDifficulty = [EASY, MEDIUM, HARD];
var difficultyPreference = 0; // initial difficulty, changes when selected

var playerColor = 0; // initial color, index for colorPalette array
const colorPalette = ["Green", "Blue", "Red", "Orange", "Purple", "Pink"]

var wallColor = "grey";
var buttonColor = "#ff0000"; // red, default button color
var buttonHover = "#00ff00"; // green, when pointer goes over it

const keys = { // accepted keys in the game
    right: false, left: false, up: false, space: false,
    rightKey: 39, leftKey: 37, upKey: 38, spaceKey: 32
}

var mousePosition = null; // changes to position of pointer on canvas

// if user is logged in
if (loggedAccount !== null) {
    const loggedObj = JSON.parse(loggedAccount);
    playerName = loggedObj.AccountDetails.Username; // get name
    // updated settings
    difficultyPreference = JSON.parse(localStorage[playerName]).Difficulty;
    playerColor = JSON.parse(localStorage[playerName]).Color;
    swapDifficulty();
}

/* ---------------------------------------------- */
/* --------------------CLASSES------------------- */
/* ---------------------------------------------- */

// player class
class Character {
    // default constructor
    constructor() {
        // initial position
        this.position = {
            x: 490,
            y: 470
        }

        // speed
        this.velocity = {
            x: 0, // left-right movement (x-Axis)
            y: 0, // up-down (y-Axis)
        }

        // dimensions
        this.width = 50
        this.height = 50

        // updated with the rectangle sides on the canvas
        this.sides = {
            top: this.position.y,
            bottom: this.position.y + this.height,
            left: this.position.x,
            right: this.position.x + this.width,
        }

        // limits not to be exceeded
        this.border = {
            top: 20,
            left: leftBorder,
            right: rightBorder,
        }

        this.gravity = difficulty.playerGravity;
        this.speed = difficulty.playerSpeed; // left, right movement speed
        this.jumpLimit = difficulty.playerJumpLimit; // how much it can jump
    }

    draw() {
        // draw player square
        ctx.fillStyle = colorPalette[playerColor];
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        if (!(this.position.y > canvas.height)) { // when in the playing area
            // move the object
            this.position.y += this.velocity.y;
            this.position.x += this.velocity.x;

            // update position on canvas
            this.sides.top = this.position.y;
            this.sides.bottom = this.position.y + this.height;
            this.sides.left = this.position.x;
            this.sides.right = this.position.x + this.width;

            // apply gravity when player is jumping 
            if (this.velocity.y < this.jumpLimit)
                this.velocity.y += this.gravity;

            if (this.sides.left + this.velocity.x > this.border.left && this.velocity.x <= -1) { // when within the borders
                this.velocity.x += this.speed; // moves to the right
            }
            if (this.sides.left + this.velocity.x < this.border.left || this.velocity.x < 0) { // stops at the left border
                this.velocity.x = 0;
            }
            if (this.sides.right + this.velocity.x < this.border.right && this.velocity.x > 1) { // when within the borders
                this.velocity.x -= this.speed; // moves to the left
            }
            if (this.sides.right + this.velocity.x > this.border.right || this.velocity.x > 0) { // stops at right border
                this.velocity.x = 0;
            }
        } else if (this.sides.bottom < canvas.height - canvas.height) { // above the canvas
            this.velocity.y = 0; // unable to go further
        } else { // if fallen, change the game state
            gameState = ENDGAME; // end the game
            addScore(); // score added if a player is logged in
        }
    }
}

// floor to be jumped on
class Floor { // a slab represents a floor
    constructor({ position, dimension, ID }) {
        this.position = position
        this.dimension = dimension
        this.ID = ID // used to identify the floor to calculate score
        this.hasPower = false; // if a floor has super power
        this.hasCollectedPower = false; // if the player has collected it

        this.sides = { // where on the canvas the floor is positioned
            top: this.position.y,
            bottom: this.position.y + this.dimension.height,
            left: this.position.x,
            right: this.position.x + this.dimension.width,
        }

        this.circlePosition = { // the super power position
            x: this.position.x + this.dimension.width / 2,
            y: this.position.y - this.dimension.height / 2,
        }
        this.random = 1 + Math.random() * 100; // used to generate a super power
        this.velocity = 0; // to decrease position of floor on canvas
        this.gravity = difficulty.floorFallSpeed; // applied when the floors all falling constantly
    }

    draw() { // draw floor
        ctx.fillStyle = "white";
        ctx.fillRect(this.position.x, this.position.y, this.dimension.width, this.dimension.height + 5);
        if (this.ID % 10 === 0) { // if ID is divisible by 10, print the ID on the floor
            ctx.font = "30px charybdis";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText(this.ID, this.position.x + this.dimension.width / 2, this.position.y + this.dimension.height / 2 + 10);
        }
        if (this.ID % 2 === 0) { // check if there is a super power only on floors with even IDs
            if (this.hasPower) { // draw power if present
                ctx.beginPath();
                ctx.arc(this.circlePosition.x, this.circlePosition.y, 10, 0, 2 * Math.PI, false)
                ctx.fillStyle = "yellow";
                ctx.fill();
                if (this.hasCollectedPower) { // remove if player collected
                    this.hasPower = false;
                    this.hasCollectedPower = false;
                    if (powerCollected < 3) { // increase the number of how many got colected
                        powerCollected++;
                    }
                }
            }
        }
    }

    update() {
        this.draw(); // draw it

        // update floor position on canvas
        this.sides.top = this.position.y;
        this.sides.bottom = this.position.y + this.dimension.height;
        this.sides.left = this.position.x;
        this.sides.right = this.position.x + this.dimension.width;

        // make the power fall at the same time with floor, maintaining position on top of it
        this.circlePosition.x = this.position.x + this.dimension.width / 2;
        this.circlePosition.y = this.position.y - this.dimension.height - 2;

        this.gravity = difficulty.floorFallSpeed; // constantly decrease floors

        // if the floor goes out of the canvas, regenerate it
        if (this.sides.top > canvas.height + 30) {

            this.position.x = generatePosition(); // generate position on x-Axis
            var aWidth = generateSlabWidth(this.position.x); // generate a random width based on the position on x-Axis

            const WALL_PROXIMITY = 100;
            // if true, position on x is too close to right border
            if (aWidth < WALL_PROXIMITY) {
                aWidth += WALL_PROXIMITY; // increase the width, considering it can be anything from 1 to 100
            }

            this.dimension.width = aWidth; // set dimension

            // increase difficulty when the ID is withing the threshold increase range of min and max
            if (this.ID >= difficulty.floorIncreaseMin &&
                this.ID <= difficulty.floorIncreaseMax &&
                difficulty.floorFallSpeed <= difficulty.fallSpeedLimit) { // limit set for floor fall speed
                difficulty.floorIncreaseMin += 25; // next threshold to be achievend to increase fall speed
                difficulty.floorIncreaseMax += 28;
                difficulty.floorFallSpeed += 0.1; // increase speed
                if (difficulty.floorIncreaseMin % 100 === 0) {
                    difficulty.playerJumpLimit += 0.5; // jump higher
                    difficulty.playerGravity += 0.02; // fall faster
                    difficulty.playerPowerJump += 1; // increase the super jump
                }
            }

            this.position.y = canvas.height - 7 * 96; // replace it on top of the canvas
            this.ID += floorsToGenerate // increase its ID to the next one

            // if generated number is withing range, place a power on the floor
            if (this.random > 5 && this.random < 15) {
                this.hasPower = true;
            }
            this.random = 1 + Math.random() * 100;
        }
    }
}

// left and right walls
class Border {
    constructor({ position, dimension, color }) {
        this.position = position;
        this.dimension = dimension;
        this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.dimension.width, this.dimension.height);
    }
    update() {
        this.draw();
    }
}

// text objects placed on canvas
class Text {
    constructor({ font, color, position, align }) {
        this.font = font;
        this.color = color;
        this.position = position;
        this.align = align;
    }
    draw(text) {
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.textAlign = this.align;
        ctx.fillText(text, this.position.x, this.position.y);
    }
    write(text) {
        this.draw(text);
    }
}

// text inside a rectangle
class Button extends Text {
    constructor({ textObj }) {
        super(textObj);

        this.width = 150;
        this.height = 70;

        this.rectangle = {
            xPos: this.position.x - 75,
            yPos: this.position.y - 45,
        }
        // position on canvas
        this.sidesTop = this.rectangle.yPos + 60;
        this.sidesBottom = this.rectangle.yPos + this.height + 85;
        this.sidesLeft = this.rectangle.xPos + 5;
        this.sidesRight = this.rectangle.xPos + this.width + 25;
    }

    makeBorders(text) {
        this.write(text); // write text
        // draw rectangle
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.lineWidth = "5"
        ctx.rect(this.rectangle.xPos, this.rectangle.yPos, this.width, this.height)
        ctx.stroke();
    }
}

/* ---------------------------------------------- */
/* --------------INSTANTIATE OBJECTS------------- */
/* ---------------------------------------------- */

// instatiate wall objects

const leftWall = new Border({
    position: {
        x: 0,
        y: 0,
    },
    dimension: {
        width: leftBorder,
        height: canvas.height
    },
    color: wallColor
});

const rightWall = new Border({
    position: {
        x: rightBorder,
        y: 0,
    },
    dimension: {
        width: canvas.width,
        height: canvas.height
    },
    color: wallColor
});

// instantiate text objects

const titleText = new Text({
    font: "100px charybdis",
    color: "white",
    position: {
        x: canvas.width / 2,
        y: 120,
    },
    align: "center",
});

const playerNameObj = new Text({
    font: "50px charybdis",
    color: "#00ff00",
    position: {
        x: (canvas.width / 2) + 150,
        y: titleText.position.y + 50,
    },
    align: "center",
});

const infoText = new Text({
    font: "20px charybdis",
    color: "#00ff00",
    position: {
        x: canvas.width / 2,
        y: canvas.height - 30,
    },
    align: "center",
})

const endGameInfo = new Text({
    font: "20px charybdis",
    color: "#00ff00",
    position: {
        x: canvas.width / 2,
        y: canvas.height - 30,
    },
    align: "center",
})

const difficultyText = new Text({
    font: "50px charybdis",
    color: "white",
    position: {
        x: canvas.width / 2,
        y: titleText.position.y + 140,
    },
    align: "right",
});

const characterColorText = new Text({
    font: "50px charybdis",
    color: "white",
    position: {
        x: canvas.width / 2,
        y: difficultyText.position.y + 100,
    },
    align: "right",
});

const scoreText = new Text({
    font: "50px charybdis",
    color: "white",
    position: {
        x: 60,
        y: 50,
    },
    align: "center",
});

const scoreNumber = new Text({
    font: "50px charybdis",
    color: "red",
    position: {
        x: 70,
        y: 90
    },
    align: "center",
});

const powerText = new Text({
    font: "30px charybdis",
    color: "yellow",
    position: {
        x: canvas.width - 30,
        y: 30,
    },
    align: "center",
})

// instantiate button objects
const startButton = new Button({
    textObj: {
        font: "40px charybdis",
        color: buttonColor,
        position: {
            x: canvas.width / 2,
            y: titleText.position.y + 140
        },
        align: "center",
    }
});

const optionsButton = new Button({
    textObj: {
        font: "40px charybdis",
        color: buttonColor,
        position: {
            x: canvas.width / 2,
            y: startButton.position.y + 150,
        },
        align: "center",
    }
});

const backButton = new Button({
    textObj: {
        font: "40px charybdis",
        color: buttonColor,
        position: {
            x: canvas.width / 2,
            y: characterColorText.position.y + 130,
        },
        align: "center",
    }
})

const retryButton = new Button({
    textObj: {
        font: "40px charybdis",
        color: buttonColor,
        position: {
            x: canvas.width / 3,
            y: titleText.position.y + 350,
        },
        align: "center",
    }
})

const menuButton = new Button({
    textObj: {
        font: "40px charybdis",
        color: buttonColor,
        position: {
            x: canvas.width / 1.5,
            y: titleText.position.y + 350,
        },
        align: "center",
    }
});

const difficultySelection = new Button({
    textObj: {
        font: "50px charybdis",
        color: colorPalette[playerColor],
        position: {
            x: difficultyText.position.x * 1.4,
            y: difficultyText.position.y,
        },
        align: "center",
    }
});

const characterColorSelection = new Button({
    textObj: {
        font: "50px charybdis",
        color: colorPalette[playerColor],
        position: {
            x: characterColorText.position.x * 1.4,
            y: characterColorText.position.y,
        },
        align: "center",
    }
});

// animation
function animate() {
    window.requestAnimationFrame(animate);
    // background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameState === MENU) {
        if (loggedAccount !== null) { // when logged in, write player's name in main menu
            playerNameObj.write(playerName)
        } else { // suggest the user to create an account if not logged in
            infoText.write("If you log in, you could get your score in Top 15!");
        }
        // place text and buttons
        titleText.write("WELCOME!");
        startButton.makeBorders("Start");
        optionsButton.makeBorders("Settings");
    } else if (gameState === GAMEPLAY) {
        // generate playing area
        leftWall.update();
        rightWall.update();
        scoreText.write("Score");
        scoreNumber.write(scoreCount); // display score
        powerText.write(powerCollected + "/3"); // display powers collected
        drawObjects(); // draw floors

        player.draw();

        player.update(); // updates players position
        moveAround(); // make player move
        collisionDetection(); // identify if there is a floor under for the player to land on
        decreaseFloors(); // updates floor position
    } else if (gameState === SETTINGS) { // draw settings area
        titleText.write("SETTINGS");
        difficultyText.write("Difficulty");
        difficultySelection.makeBorders(arrayDifficulty[difficultyPreference]); // on button current selected difficulty
        characterColorText.write("Player color");
        characterColorSelection.makeBorders(colorPalette[playerColor]); // on button current selected color
        backButton.makeBorders("BACK");
        if (loggedAccount === null) { // suggest to log in
            infoText.write("You can save and load previous settings by logging in!");
        }
    } else if (gameState === ENDGAME) { // draw end of game text
        titleText.write("GAMEOVER");
        menuButton.makeBorders("Menu");
        retryButton.makeBorders("Retry");
        // reposition info text, increase font, print score
        infoText.position.y = canvas.height / 2;
        infoText.font = "50px charybdis";
        if (scoreCount < 1000) {
            infoText.write("There is room for better! You scored " + scoreCount)
        } else {
            infoText.write("Nice! You scored " + scoreCount)
        }
        if (loggedAccount !== null) {
            endGameInfo.write("Press \"Menu\" or refresh the page to see score in ranking table, if applicable.")
        }
    }
}
animate();

// reads in the buttons pressed
window.addEventListener("keydown", keyDown, false);
window.addEventListener("keyup", keyUp, false);

// to move the character on the canvas while a button is pressed, not applicable for jump
function keyDown(event) {
    if (event.keyCode === keys.rightKey) { keys.right = true }
    if (event.keyCode === keys.leftKey) { keys.left = true }
    if (event.keyCode === keys.upKey) {
        if (powerCollected === 3) { // power jump when 3 collected and arrow up pressed
            player.velocity.y = -difficulty.playerPowerJump;
            powerCollected = 0;
        }
    }
    if (event.keyCode === keys.spaceKey) { // jump
        if (player.velocity.y === 0)
            player.velocity.y = -difficulty.playerJumpLimit;
    }
}

// stop the character when the key press is released
function keyUp(event) {
    if (event.keyCode === keys.rightKey) { keys.right = false }
    if (event.keyCode === keys.leftKey) { keys.left = false }
}

canvas.addEventListener("mousemove", hoverEffects, false);
canvas.addEventListener("click", changeState, false);

// hover effect when cursor goes over button
function hoverEffects(evt) {
    mousePosition = getMousePos(canvas, evt);
    if (gameState === MENU) {
        if (isPointerInsideButton(startButton, mousePosition)) {
            startButton.color = buttonHover;
        } else {
            startButton.color = buttonColor;
        }
        if (isPointerInsideButton(optionsButton, mousePosition)) {
            optionsButton.color = buttonHover;
        } else {
            optionsButton.color = buttonColor;
        }
    } else if (gameState === SETTINGS) {
        if (isPointerInsideButton(backButton, mousePosition)) {
            backButton.color = buttonHover;
        } else {
            backButton.color = buttonColor;
        }
    } else if (gameState === ENDGAME) {
        if (isPointerInsideButton(menuButton, mousePosition)) {
            menuButton.color = buttonHover;
        } else {
            menuButton.color = buttonColor;
        }
        if (isPointerInsideButton(retryButton, mousePosition)) {
            retryButton.color = buttonHover;
        } else {
            retryButton.color = buttonColor;
        }
    }
}

// on click, switches between states of the game
function changeState(evt) {
    if (gameState === MENU) {
        if (isPointerInsideButton(startButton, mousePosition)) {
            initialiseGame(); // initialises the actor and floors with the relevant settings selected when play button is pressed 
            gameState = GAMEPLAY;
        }
        if (isPointerInsideButton(optionsButton, mousePosition)) {
            gameState = SETTINGS;
        }
    } else if (gameState === SETTINGS) {
        if (isPointerInsideButton(backButton, mousePosition)) {
            gameState = MENU;
        }
        if (isPointerInsideButton(difficultySelection, mousePosition)) {
            if (difficultyPreference === arrayDifficulty.length - 1) { // change difficulty settings
                difficultyPreference = 0; // if last element of array, get the index back to 0
            } else {
                difficultyPreference++; // increase otherwise
            }
            swapDifficulty();
        }
        if (isPointerInsideButton(characterColorSelection, mousePosition)) {
            if (playerColor === colorPalette.length - 1) { // change color settings
                playerColor = 0;
            } else {
                playerColor++;
            }
            characterColorSelection.color = colorPalette[playerColor];
            difficultySelection.color = colorPalette[playerColor];
        }
    } else if (gameState === ENDGAME) {
        if (isPointerInsideButton(menuButton, mousePosition)) {
            window.location.reload(); // refresh the page to restart whole game
        }
        if (isPointerInsideButton(retryButton, mousePosition)) {
            initialiseGame();
            gameState = GAMEPLAY;
        }
    }
}

// updates mousePosition with an object holding x and y of the cursor position on canvas
function getMousePos(canvas, event) {
    var inside = canvas.getBoundingClientRect();
    return {
        x: event.clientX - inside.left,
        y: event.clientY - inside.top
    };
}

// called in animate to move the character accordingly based on the pressed key
function moveAround() {
    if (keys.right) { // move to the right
        if (player.sides.right < rightBorder) {
            player.velocity.x += player.speed;
        }
    }
    if (keys.left) { // move to the left
        if (player.sides.left > leftBorder) {
            player.velocity.x -= player.speed;
        }
    }
    if (keys.space) {
        player.velocity.y = -4;
    }
}

// to draw floors on canvas from the array
function drawObjects() {
    for (let i = 0; i < floors.length; i++) {
        var floorObj = floors[i];
        floorObj.update();
    }
}

// to give the impression player is advancing further up
function decreaseFloors() {
    for (let item = 0; item < floors.length; item++) {
        // iterate all floor objects in the array
        if (player.velocity.y < 0) { // player jumping, decrease floors based on the jump
            floors[item].velocity = player.velocity.y;
            floors[item].position.y -= floors[item].velocity;
            floors[item].velocity = 0;
        }
        if (scoreCount > 50) { // when score is 60, apply the gravity to floors
            floors[item].position.y += floors[item].gravity;
        }
    }
}

// identifies the floors under the player to make the player stop
function collisionDetection() {
    for (let i = 0; i < floors.length; i++) {
        const aFloor = floors[i];

        // collecting superpower, when touching the power
        if (aFloor.hasPower &&
            player.sides.right > aFloor.circlePosition.x &&
            player.sides.left < aFloor.circlePosition.x &&
            player.sides.top < aFloor.circlePosition.y &&
            player.sides.bottom > aFloor.circlePosition.y) {
            aFloor.hasCollectedPower = true;
        }

        // check which floor is under
        if (player.sides.bottom < aFloor.sides.top + 5 && // +5 error margin
            !(player.sides.bottom < aFloor.sides.top - 96)) {
            if (player.sides.bottom >= aFloor.sides.top - 5 && // -5 error margin
                player.sides.left <= aFloor.sides.right &&
                player.sides.right >= aFloor.sides.left &&
                player.velocity.y > 0) {
                player.velocity.y = 0;
                player.position.y = aFloor.sides.top - player.height;

                if (scoreCount + ((aFloor.ID * 10) - scoreCount) > scoreCount)
                    scoreCount += ((aFloor.ID * 10) - scoreCount); // set the score
            }
        } else {
            player.gravity = difficulty.playerGravity; // nothing is under player, falling
        }
    }
}

// checks if any account is logged in, if so takes the name and saves score in localStorage in the relevant field
function addScore() {
    if (sessionStorage.length !== 0) {
        var accountObj = JSON.parse(localStorage[playerName]);

        // store it in the relevant array of the account, sort and reverse highest to lowest
        accountObj.Score.push(scoreCount);
        accountObj.Score.sort();
        accountObj.Score.reverse();

        accountObj.Color = playerColor; // save settings
        accountObj.Difficulty = difficultyPreference; // save settings

        accountData = JSON.stringify(accountObj);
        localStorage.setItem(playerName, accountData); // save it directly in localStorage to avoid losing data
    }
}

// generate width of a floor
function generateSlabWidth(xAxisPos) {
    // generate a width based on difficulty
    var width = Math.round(difficulty.floorMinWidth + Math.random() * difficulty.floorMaxWidth);

    // if the floor is going out of the right border, cut excess and return result
    if (width + xAxisPos > rightBorder) {
        var excess = (width + xAxisPos) - rightBorder;
        return width - excess;
    } else {
        return width;
    }
}

// generate position of a floor on x-Axis
function generatePosition() {
    return Math.round(leftBorder + Math.random() * (rightBorder - leftBorder - leftBorder - leftBorder));
}

// to check if pointer is inside a button
function isPointerInsideButton(aButton, mousePosition) {
    if (mousePosition.x > aButton.sidesLeft &&
        mousePosition.y > aButton.sidesTop &&
        mousePosition.x < aButton.sidesRight &&
        mousePosition.y < aButton.sidesBottom) {
        return true;
    } else {
        return false;
    }
}

// toggle between difficulties
function swapDifficulty() {
    if (arrayDifficulty[difficultyPreference] === EASY) {
        difficulty.playerGravity = 0.1;
        difficulty.playerSpeed = 3;
        difficulty.playerJumpLimit = 5;
        difficulty.floorMinWidth = 100;
        difficulty.floorMaxWidth = 150;
        difficulty.floorFallSpeed = 0.5;
        difficulty.floorIncreaseMin = 25;
        difficulty.floorIncreaseMax = 30;
        difficulty.fallSpeedLimit = 0.8;
    } else if (arrayDifficulty[difficultyPreference] === MEDIUM) {
        difficulty.playerGravity = 0.1;
        difficulty.playerSpeed = 4;
        difficulty.playerJumpLimit = 4;
        difficulty.floorMinWidth = 75;
        difficulty.floorMaxWidth = 125;
        difficulty.floorFallSpeed = 0.75;
        difficulty.floorIncreaseMin = 25;
        difficulty.floorIncreaseMax = 30;
        difficulty.fallSpeedLimit = 1.3;
    } else if (arrayDifficulty[difficultyPreference] === HARD) {
        difficulty.playerGravity = 0.1;
        difficulty.playerSpeed = 5;
        difficulty.playerJumpLimit = 4;
        difficulty.floorMinWidth = 50;
        difficulty.floorMaxWidth = 100;
        difficulty.floorFallSpeed = 0.75;
        difficulty.floorIncreaseMin = 25;
        difficulty.floorIncreaseMax = 30;
        difficulty.fallSpeedLimit = 1.2;
    }
}

// assigns player and floors variables with relevant objects, and resets score and power
function initialiseGame() {
    scoreCount = 0;
    powerCollected = 0;
    player = new Character;
    floors = [
        new Floor({ // bottom floor
            position: {
                x: leftBorder,
                y: canvas.height - 40,
            },
            dimension: {
                width: canvas.width - leftBorder * 2,
                height: floorHeight,
            },
            ID: 0
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 1
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 2 * 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 2
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 3 * 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 3
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 4 * 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 4
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 5 * 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 5
        }),
        new Floor({
            position: {
                x: generatePosition(),
                y: canvas.height - 40 - 6 * 96,
            },
            dimension: {
                width: generateSlabWidth(),
                height: floorHeight,
            },
            ID: 6
        }),
    ];
}