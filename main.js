/** 캔버스 */
const canvas = document.getElementById("canvas");
canvas.width = 800;
canvas.height = 500;
const ctx = canvas.getContext("2d");

/** 최초 게임 시작 판단 */
let gameStarted = false;

/** 
gameStarted : 게임이 시작되었는지 확인하는 변수
최초 화면이 로드되었을 때는 게임이 시작되어있으면 안되죠
>> 그래서 false 로 초기화함 
**/

/** 캔버스 관련 이미지 */
const BG_MOVING_SPEED = 5;
let bgX = 0;

/**
BG_MOVING_SPEED, bgX : 배경 이미지 이동 속도 
캐릭터는 이동하지 않음 
>> 배경이 좌측으로 계속 움직이는 효과를 주면서 
캐릭터가 마치 달리는 것과 같은 효과를 주려고 해요
  */

/** 점수 */
let scoreText = document.getElementById("score");
let score = 0;

/**
scoreText, score : 
HTML에서 정의해놓은 점수 영역 텍스트와 점수를 임시 저장할 변수
장애물이 하나씩 캐릭터를 ‘무사히’ 지나갈 때 마다 10점씩 올려야 하기 때문에 
변수화 시켜 저장해두었어요
 * 
 */

// 게임 주요 설정 변수(상수) 세팅
/** 르탄이 */
const RTAN_WIDTH = 100; // 르탄이 가로 너비
const RTAN_HEIGHT = 100; // 르탄이 세로 높이
const RTAN_INITIAL_X_POSITION = 10; // 르탄이의 위치 X 좌표
const RTAN_INITIAL_Y_POSITION = 400; // 르탄이의 위치 Y 좌표

/** 장애물 */
const OBSTACLE_WIDTH = 30; // 장애물 너비
const OBSTACLE_HEIGHT = 30; // 장애물 높이
const OBSTACLE_FREQUENCY = 50; // 장애물 생성 빈도
const OBSTACLE_SPEED = 7; // 장애물 속도

/** 게임 변수 */
let timer = 0; // 장애물 생성 시간(한 프레임이 지날 때마다 증가하는 시간)
let obstacleArray = [];
// 장애물 배열(*장애물이 여러개일 수 있기 때문에 배열로 관리함)
// 장애물이 계속 생성될텐데, 장애물을 넣고 관리하는 변수
let gameOver = false;
// 게임 종료 여부, true 또는 false 값
// 게임이 종료된 경우 game over 화면 및 restart를 보여줘야 하기 때문
let jump = false;
// 점프 여부
// 키보드의 space가 눌렸을 때 true로 바꾸어 줄 값
// 즉, jump가 true 상태라면 캐릭터가 위로 떠오르면 되겠죠!
// 반대로 jump가 false 상태라면 캐릭터가 아래로 내려가면 될 것 같아요

/** 오디오 객체 */
const jumpSound = new Audio();
jumpSound.src = "./assets/sounds/jump.mp3";
const bgmSound = new Audio();
bgmSound.src = "./assets/sounds/bgm.mp3";
const scoreSound = new Audio();
scoreSound.src = "./assets/sounds/score.mp3";
const defeatSound = new Audio();
defeatSound.src = "./assets/sounds/defeat2.mp3";

/** 이미지 */
// (1) 배경
const bgImage = new Image();
bgImage.src = "./assets/images/rtan_background.png";
// (2) 게임 시작
const startImage = new Image();
startImage.src = "./assets/images/rtan_start.png";
// (3) 게임 오버
const gameoverImage = new Image();
gameoverImage.src = "./assets/images/rtan_gameover.png";
// (4) 게임 재시작
const restartImage = new Image();
restartImage.src = "./assets/images/rtan_restart.png";
// (5) 달리는 르탄이 A
const rtanAImage = new Image();
rtanAImage.src = "./assets/images/rtan_running_a.png";
// (6) 달리는 르탄이 B
const rtanBImage = new Image();
rtanBImage.src = "./assets/images/rtan_running_b.png";
// (7) 게임 오버 르탄이
const rtanCrashImage = new Image();
rtanCrashImage.src = "./assets/images/rtan_crash.png";
// (8) 장애물
const rtan_obstacle = new Image();
rtan_obstacle.src = "./assets/images/rtan_obstacle.png";

/**
 * 게임 시작 화면을 그리는 함수
 */
function drawStartScreen() {
  // 배경 이미지 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;

  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

// 르탄이 객체
const rtan = {
  x: RTAN_INITIAL_X_POSITION,
  y: RTAN_INITIAL_Y_POSITION,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {
    // when rtan crashes, draw crash image
    if (gameOver) {
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
      return;
    } else {
      if (timer % 20 > 10) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};

// 장애물 객체 생성을 위한 클래스
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y = Math.floor(Math.random() * (canvas.height - OBSTACLE_HEIGHT));
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
  }
  draw() {
    ctx.drawImage(rtan_obstacle, this.x, this.y, this.width, this.height);
  }
}

/**
 * 게임 애니메이션 함수
 */
function animate() {
  if (gameOver) {
    return;
  }

  bgmSound.play();

  // 배경 이미지 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX + canvas.width, 0, canvas.width, canvas.height);

  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;

  if (timer % OBSTACLE_FREQUENCY === 0) {
    const obstacle = new Obstacle();
    obstacleArray.push(obstacle);
  }

  obstacleArray.forEach((a) => {
    // x가 0보다 작아지면 화면 밖으로 나가는 것이므로 삭제
    if (a.x < -OBSTACLE_WIDTH) {
      obstacleArray.shift();
      score += 10;
      scoreText.innerHTML = "현재점수: " + score;
      scoreSound.play();
      setTimeout(() => {
        scoreSound.pause(); // 일정 시간 후에 오디오 일시정지
        scoreSound.currentTime = 0; // 오디오 재생 위치를 시작으로 재설정
      }, 350); // 200ms 후에 오디오 일시정지
    }

    if (collision(rtan, a)) {
      timer = 0;
      gameOver = true;

      jump = false;

      ctx.drawImage(
        gameoverImage,
        canvas.width / 2 - 100,
        canvas.height / 2 - 50,
        200,
        100
      );
      ctx.drawImage(
        restartImage,
        canvas.width / 2 - 50,
        canvas.height / 2 + 50,
        100,
        50
      );

      bgmSound.pause();
      defeatSound.play();

      return;
    }

    a.x -= OBSTACLE_SPEED; // 한 프레임이 지날 때마다 장애물을 왼쪽으로 일정량 이동

    a.draw();
  });

  if (jump) {
    if (rtan.y < 0) {
      jump = false;
    } else {
      rtan.y -= 3;
    }
  } else {
    if (rtan.y < 400) {
      rtan.y += 3;
    }
  }
  if (timer > 50) {
    jump = false;
    timer = 0;
  }

  rtan.draw();
  timer++;
  requestAnimationFrame(animate);
}

/**
 * 게임을 재시작하는 함수
 */
function restartGame() {
  gameOver = false;
  obstacleArray = [];
  timer = 0;
  score = 0;
  scoreText.innerHTML = "현재점수: " + score;
  animate();
}

/**
 * 충돌 체크 함수
 */
function collision(first, second) {
  return !(
    first.x > second.x + second.width ||
    first.x + first.width < second.x ||
    first.y > second.y + second.height ||
    first.y + first.height < second.y
  );
}

/**
 * 키보드 이벤트
 */
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    jump = true;
    jumpSound.play(); // 점프 소리 재생
    setTimeout(() => {
      jumpSound.pause(); // 일정 시간 후에 오디오 일시정지
      jumpSound.currentTime = 0; // 오디오 재생 위치를 시작으로 재설정
    }, 200); // 200ms 후에 오디오 일시정지
  }
});

/**
 * 마우스 이벤트
 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    gameStarted = true;
    animate();
  }

  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    restartGame();
  }
});

canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임오버 상태에서만 마우스 커서를 변경한다.
  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    canvas.style.cursor = "pointer";
  } else if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    canvas.style.cursor = "pointer";
  } else {
    canvas.style.cursor = "default";
  }
});

/**
 * 두 개의 이미지가 모두 로드되면 게임 시작 화면을 그린다.
 */
let bgImageLoaded = new Promise((resolve) => {
  bgImage.onload = resolve;
});

let startImageLoaded = new Promise((resolve) => {
  startImage.onload = resolve;
});

Promise.all([bgImageLoaded, startImageLoaded]).then(drawStartScreen);
