let movers = [];
let freeMovers = [];
let dropTimes = [];
const letters1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letters2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letters3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let nextDropIndex = 0;
let lastDropTime = 0;

let rowLetters = [[], [], [], [], [], [], [], []];
let isResetting = false;
let resetStartTime = null;

let draggedMover = null;
let freeZoneY = 0;

let dropSound;
let resetSign;

let isStarted = false; // user has clicked "start"

function preload() {
  soundFormats('mp3');
  dropSound = loadSound('drop.mp3');
  resetSign = loadImage('resetsign.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 26, 100, 100);
  textFont('Helvetica Bold'); // default font for falling letters
}

function draw() {
  background('#ECEEF3');

  if (!isStarted) {
    fill('#ECEEF3');
    rect(0, 0, width, height);
    textAlign(CENTER, CENTER);
    textFont('Helvetica Bold');
    textSize(36);
    fill(0);
    text("Tap to start", width / 2, height / 2);
    return;
  }

  // Draw black reference line
  let xSpacing = width / 9;
  let rowWidth = xSpacing * 9;
  let extra = 100;
  let xStart = (width - rowWidth) / 2 + xSpacing / 2 - extra / 2;
  let xEnd = xStart + rowWidth - xSpacing + extra;
  freeZoneY = height - 115 * 0.6 - ((0 + 2.85) * 115 * 0.8) + 58;
  stroke(0);
  strokeWeight(4);
  line(xStart, freeZoneY, xEnd, freeZoneY);

  // ✅ Draw static caption under the line (always visible)
  let captionY = freeZoneY + 20;
  let captionX = xStart;
  let fontSize = 20;
  fill(0);
  noStroke();
  textSize(fontSize);
  textAlign(LEFT, TOP);

  // Draw first part in Helvetica Bold
textFont('Helvetica Bold');
let leftText = '“Fragments of Now” ';
text(leftText, captionX, captionY);

// Measure width of first part
let leftTextWidth = textWidth(leftText);

// Draw second part in Helvetica (regular)
textFont('Helvetica');
let rightTextPart = ' What you hold becomes what you remember.';
text(rightTextPart, captionX + leftTextWidth, captionY);

let rightTextX = xEnd + 5; // 靠近右边但留些边距
let rightTextY = freeZoneY + 20;
let rightTextLines = [
  "A random letter drops every second.",
  "Once the screen is full, all letters will disappear.",
  "You can drag them below to build words, thoughts, or layer them up.",
  "With each round, your choices will be frozen in place--",
  "like moments etched into memory.",
  "In each fleeting moment, shape your own meaning."
];

// Set font and alignment for right text
textFont('Helvetica');
textAlign(RIGHT);
textLeading(26);

// Draw the right-aligned text
for (let i = 0; i < rightTextLines.length; i++) {
  text(rightTextLines[i], rightTextX, rightTextY + i * 26);
}

  // Always show reset icon
  let resetSignWidth = 60;
  let resetSignHeight = (resetSign.height / resetSign.width) * resetSignWidth;
  let resetSignX = width - resetSignWidth - 43;
  let resetSignY = height - resetSignHeight - 20;
  image(resetSign, resetSignX, resetSignY, resetSignWidth, resetSignHeight);

  // Display falling letters
  for (let mover of movers) {
    if (!mover.isDragged && !mover.isInFreeSpace) {
      let gravity = createVector(0, 0.55);
      mover.applyForce(gravity);
      mover.update();
      mover.checkEdges();
    }
    mover.display();
  }

  // Display dragged letters in free zone
  for (let fm of freeMovers) {
    fm.display();
  }

  // Handle auto reset
  if (nextDropIndex >= 68 && !isResetting) {
    isResetting = true;
    resetStartTime = millis();
  }

  if (isResetting) {
    if (millis() - resetStartTime > 2000) {
      resetAnimation(false); // auto-reset: do NOT clear free letters
    }
    return;
  }

  // Drop a letter every second
  if (nextDropIndex < 68 && millis() - lastDropTime >= 1000) {
    dropNextLetter();
  }
}

function mousePressed() {
  if (!isStarted) {
    userStartAudio();
    isStarted = true;
    initializeAnimation();
    lastDropTime = millis() - 1000;
    return;
  }

  // Check if reset image is clicked
  let resetSignWidth = 60;
  let resetSignHeight = (resetSign.height / resetSign.width) * resetSignWidth;
  let resetSignX = width - resetSignWidth - 43;
  let resetSignY = height - resetSignHeight - 20;

  if (
    mouseX >= resetSignX &&
    mouseX <= resetSignX + resetSignWidth &&
    mouseY >= resetSignY &&
    mouseY <= resetSignY + resetSignHeight
  ) {
    resetAnimation(true); // user clicked reset icon: clear free letters
    return;
  }

  // Drag a landed letter
  for (let m of movers) {
    if (m.isUnderMouse(mouseX, mouseY) && (m.hasLanded || m.isInFreeSpace)) {
      draggedMover = m;
      m.isDragged = true;
      break;
    }
  }
}

function mouseDragged() {
  if (draggedMover) {
    draggedMover.position.x = mouseX;
    draggedMover.position.y = mouseY;
  }
}

function mouseReleased() {
  if (draggedMover) {
    if (draggedMover.position.y > freeZoneY) {
      draggedMover.isInFreeSpace = true;
      draggedMover.rotationAngle = 0;
      if (!freeMovers.includes(draggedMover)) {
        freeMovers.push(draggedMover);
      }
    } else if (draggedMover.isInFreeSpace && draggedMover.position.y < freeZoneY) {
      draggedMover.position.y = freeZoneY + 5;
    }
    draggedMover.isDragged = false;
    draggedMover = null;
  }
}

function dropNextLetter() {
  let row;
  if (nextDropIndex < 9) row = 0;
  else if (nextDropIndex < 17) row = 1;
  else if (nextDropIndex < 26) row = 2;
  else if (nextDropIndex < 34) row = 3;
  else if (nextDropIndex < 43) row = 4;
  else if (nextDropIndex < 51) row = 5;
  else if (nextDropIndex < 60) row = 6;
  else row = 7;

  let col = nextDropIndex - [0, 9, 17, 26, 34, 43, 51, 60][row];
  let xSpacing = (row % 2 === 0) ? width / 9 : width / 9.5;
  let lettersInRow = (row % 2 === 0) ? 9 : 8;
  let rowWidth = lettersInRow * xSpacing;
  let xStart = (width - rowWidth) / 2 + xSpacing / 2;
  let xPosition = xStart + col * xSpacing;

  let letter = rowLetters[row][col];
  let m = new Mover(xPosition, 0, letter, row, col);
  movers.push(m);
  nextDropIndex++;
  lastDropTime = millis();
}

function resetAnimation(clearFreeMovers) {
  movers = [];
  dropTimes = [];
  nextDropIndex = 0;
  lastDropTime = millis() - 1000;
  isResetting = false;
  resetStartTime = null;

  if (clearFreeMovers) {
    freeMovers = [];
  }

  initializeAnimation();
}

function initializeAnimation() {
  shuffleArray(letters1);
  shuffleArray(letters2);
  shuffleArray(letters3);

  rowLetters[0] = letters1.slice(0, 9);
  rowLetters[1] = letters1.slice(9, 17);
  rowLetters[2] = letters1.slice(17);

  rowLetters[3] = letters2.slice(0, 8);
  rowLetters[4] = letters2.slice(8, 17);
  rowLetters[5] = letters2.slice(17);

  rowLetters[6] = letters3.slice(0, 9);
  rowLetters[7] = letters3.slice(9, 17);

  for (let i = 0; i < rowLetters.length; i++) {
    shuffleArray(rowLetters[i]);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

class Mover {
  constructor(x, y, letter, row, col) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.letter = letter;
    this.size = 115;
    this.hasLanded = false;
    this.settleBounces = 0;
    this.maxSettleBounces = 5;
    this.initialBounceHeight = 3.5;
    this.row = row;
    this.col = col;
    this.rotationAngle = 0;
    this.rotationSpeed = 0;
    this.rotationDirection = random() > 0.5 ? 1 : -1;
    this.isResting = false;
    this.isDragged = false;
    this.isInFreeSpace = false;
    this.hasPlayedDropSound = false;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
    if (!this.hasLanded) {
      this.rotationSpeed = this.velocity.y * 0.002 * this.rotationDirection;
      this.rotationAngle += this.rotationSpeed;
    }
  }

  display() {
    push();
    translate(this.position.x, this.position.y);
    if (!this.isDragged) rotate(this.rotationAngle);
    else rotate(0);
    textAlign(CENTER, CENTER);
    textFont('Helvetica Bold'); // falling letters always use bold
    textSize(this.size);
    fill(0);
    noStroke();
    text(this.letter, 0, 0);
    pop();
  }

  checkEdges() {
    let halfHeight = this.size * 0.6;
    let groundLevel = height - halfHeight - ((this.row + 2.85) * this.size * 0.8);
    if (this.position.y > groundLevel) {
      this.position.y = groundLevel;
      if (!this.hasLanded) {
        this.hasLanded = true;
        this.velocity.y = -this.initialBounceHeight;
        this.rotationSpeed = 0;
        if (!this.hasPlayedDropSound && dropSound && dropSound.isLoaded()) {
          dropSound.play();
          this.hasPlayedDropSound = true;
        }
      } else if (this.settleBounces < this.maxSettleBounces) {
        let decayFactor = 0.9;
        this.velocity.y *= decayFactor;
        this.settleBounces++;
      }
    }
  }

  isUnderMouse(mouseX, mouseY) {
    return (
      mouseX > this.position.x - this.size / 2 &&
      mouseX < this.position.x + this.size / 2 &&
      mouseY > this.position.y - this.size / 2 &&
      mouseY < this.position.y + this.size / 2
    );
  }
}