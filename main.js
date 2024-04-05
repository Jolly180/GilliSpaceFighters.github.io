const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const gameOverScreen = document.getElementById("gameOverScreen");
const gameOverScore = document.getElementById("gameOverScore");

const STANDARD_DAMAGE = 10;
const STANDARD_BULLET_SPEED = 10;

const bulletsFired = [];
const enemies = [];
const audioPlaying = [];
const explosionFrames = [];

let enemyGenerationCooldown = false;
let gameOver = false;
let score = 0;

const keys = {
  space : {
    pressed : false,
  },
  a : {
    pressed : false,
  },
  d : {
    pressed : false,
  },
}


for (let i = 0; i < 8; i++) {
  let imgInstance = new Image;
  imgInstance.src = `Explosion${i}.png`;
  explosionFrames.push(imgInstance);
}

class Bullet {
  constructor(damage, speed, x, y, width, height, color, type) {
    this.damage = damage;
    this.speed = speed;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.type = type;
    this.velocity_x = 0;
    this.velocity_y = 0;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.fillRect(
      Math.floor(this.x), 
      Math.floor(this.y), 
      this.width, 
      this.height
    );
  }

  move() {
    this.x += this.velocity_x;
    this.y += this.velocity_y;
  }
}

class SpaceShip {
  constructor(speed, x, y, width, height, img, shooting_sfx, shooting_sfx_volume, bulletColor, type, value, health) {
    this.speed = speed;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.img = new Image();
    this.img.src = img;
    this.shooting_sfx = shooting_sfx;
    this.shooting_sfx_volume = shooting_sfx_volume;
    this.bulletColor = bulletColor;
    this.type = type;
    this.value = value;
    if (this.type == "player") this.shootingDirection = -1
    else this.shootingDirection = 1
    this.velocity_x = 0;
    this.velocity_y = 0;
    this.alive = true;
    this.explosionIndex = 0;
    this.bulletSpeed = STANDARD_BULLET_SPEED;
    this.bulletDamage = STANDARD_DAMAGE;
    this.health = health;
  }

  draw() {
    if (!this.alive) return;
    ctx.drawImage(
      this.img,
      Math.floor(this.x), 
      Math.floor(this.y), 
      this.height, 
      this.width,
    );
  }

  move() {
    if (!this.alive) return;
    this.x += this.velocity_x;
    this.y += this.velocity_y;
  }

  shoot() {
    if (!this.alive) return;
    let audioInstance = new Audio(this.shooting_sfx)
    audioInstance.volume = this.shooting_sfx_volume;
    audioInstance.play();
    audioPlaying.push(audioInstance);
    let bulletInstance = new Bullet(
      this.bulletDamage, //Damage
      this.bulletSpeed, //Speed
      this.x + this.width / 2 - 3, //x
      this.y, //y
      6, //Width
      30, //Height
      this.bulletColor, //Bullet Color
      this.type //Type
    );
    bulletInstance.velocity_y = bulletInstance.speed * this.shootingDirection;
    bulletsFired.push(bulletInstance);
  }
}

const generateEnemy = () => {
  enemyGenerationCooldown = false;
  if (Math.random() > 0.5) {
    let enemyInstance = new SpaceShip(  
      1, //Speed
      Math.floor(Math.random() * (canvas.width - 100)), //x
      0, // y
      100, //Width
      100, //Height
      "Enemy_sprite.png", //Sprite Path
      "shoot1.wav", //SFX Path
      0.05, //SFX volume Change Maybe
      "red", //Bullet Color
      "enemy", //Type
      10, //Value
      10, //Health
      );
    enemyInstance.velocity_y = enemyInstance.speed;
    enemyInstance.bulletSpeed = 4;
    enemies.push(enemyInstance);
  }
}

const checkCollision = (a, b) => {
  return  a.x <= b.x + b.width &&
          a.x + a.width >= b.x &&
          a.y <= b.y + b.height &&
          a.y + a.height >= b.y;
}

const updateExplosionAnimation = (enemy) => {
  if (enemy.explosionIndex < 8) {
    ctx.drawImage(explosionFrames[enemy.explosionIndex], enemy.x, enemy.y, enemy.width, enemy.height);
    enemy.explosionIndex++;
    requestAnimationFrame(() => {updateExplosionAnimation(enemy)});
  } else {
    enemies.splice(enemies.indexOf(enemy), 1);
  }
}

const setGameOverScreen = () => {
  gameOver = true;
  let audioInstance = new Audio("fail.wav")
  audioInstance.volume = 0.4;
  audioInstance.play();
  audioPlaying.push(audioInstance);
  gameOverScreen.style.zIndex = 1;
  gameOverScore.innerHTML = `Score: ${score}`
}

let player = new SpaceShip(
  5, //Speed
  canvas.width / 2 - 25, //x
  canvas.height - 100, //y
  100, //Width
  100, //Height
  "Player_Sprite_128.png", //Sprite Path 
  "shoot_player.wav", //SFX Path
  0.05, //SFX Volume
  "lightgreen", //Bullet Color
  "player", //Type
  0, //Value
  30, //Health
);

document.addEventListener("keyup", ({code}) => {
  switch (code) {
    case "KeyA":
      keys.a.pressed = false;
      break;
    case "KeyD":
      keys.d.pressed = false;
      break;
  }
})

document.addEventListener("keydown", ({code}) => {
  switch (code) {
    case "Space":
      keys.space.pressed = true;
      break;
    case "KeyA":
      keys.a.pressed = true;
      break;
    case "KeyD":
      keys.d.pressed = true;
      break;
  }
});

const update = () => {
  if (!gameOver) requestAnimationFrame(update);
  ctx.fillStyle = "#050532";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (keys.space.pressed) {
    player.shoot();
    keys.space.pressed = false;
  }
  if (keys.a.pressed && player.x > 0) player.velocity_x = -player.speed;
  else if (keys.d.pressed && player.x + player.width < canvas.width) player.velocity_x = player.speed;
  else player.velocity_x = 0;
 
  player.move();
  player.draw();
  
  for (let bullet of bulletsFired) {
    if (bullet.x > canvas.width || 
    bullet.x < 0 || 
    bullet.y > canvas.height || 
    bullet.y < 0) bulletsFired.splice(bulletsFired.indexOf(bullet), 1);
    bullet.move();
    bullet.draw();

    for (let enemy of enemies) {
      if (checkCollision(bullet, enemy) && bullet.type == "player" && enemy.alive) {
        enemy.health -= bullet.damage;
        bulletsFired.splice(bulletsFired.indexOf(bullet), 1);
        if (enemy.health <= 0) {
          score += enemy.value;
          enemy.alive = false;
          let audioInstance = new Audio("explosion.wav")
          audioInstance.volume = 0.4;
          audioInstance.play();
          audioPlaying.push(audioInstance);
          updateExplosionAnimation(enemy);
        }
      }
    }

    if (checkCollision(bullet, player) && bullet.type == "enemy" && player.alive) {
      player.health -= bullet.damage;
      bulletsFired.splice(bulletsFired.indexOf(bullet), 1);
      if (player.health <= 0) {
        player.alive = false;
        audioInstance = new Audio("explosion.wav")
        audioInstance.volume = 0.4;
        audioInstance.play();
        audioPlaying.push(audioInstance);
        updateExplosionAnimation(player);
        setTimeout(setGameOverScreen, 1000);
      }
    }
  }

  if (!enemyGenerationCooldown) {
    setTimeout(generateEnemy, 1000);
    enemyGenerationCooldown = true;
  }

  for (let enemy of enemies) {
    if (enemy.x > canvas.width || 
    enemy.x < 0 || 
    enemy.y > canvas.height || 
    enemy.y < 0) enemies.splice(enemies.indexOf(enemy), 1);
    enemy.move();
    enemy.draw();
    if (Math.random() > 0.999) enemy.shoot();
  }

  ctx.font = "48px arial";
  ctx.fillStyle = "white";
  ctx.fillText(score, 10, 50);
}

player.img.onload = () => {
  player.draw();
}
explosionFrames[explosionFrames.length - 1].onload = () => {
  update();
}
