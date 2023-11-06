// screen size variables
var SCREEN_WIDTH = window.innerWidth,
  SCREEN_HEIGHT = window.innerHeight,
  HALF_WIDTH = window.innerWidth / 2,
  HALF_HEIGHT = window.innerHeight / 2,
  touchable = "ontouchstart" in window,
  touchController,
  touchThrustTop = 0.25,
  touchThrustBottom = 0.9,
  touchRotateRange = 0.2,
  touchRotateStartAngle = 0,
  touchRotate = false,
  rotateDialBrightness = 0,
  fps = 60,
  mpf = 1000 / fps,
  counter = 0,
  gameStartTime = Date.now(),
  skippedFrames,
  leftKey = KeyTracker.LEFT,
  rightKey = KeyTracker.RIGHT,
  startKey = " ",
  selectKey = "",
  abortKey = "",
  startMessage =
    "JORDAN PROTOTYPE LANDER<br><br>CLICK TO PLAY<br>ARROW KEYS TO MOVE",
  singlePlayMode = false, // for arcade machine
  lastMouseMove = Date.now(),
  lastMouseHide = 0,
  mouseHidden = false;

if (touchable) touchController = new TouchController();
// game states
var WAITING = 0,
  PLAYING = 1,
  LANDED = 2,
  CRASHED = 3,
  GAMEOVER = 4,
  gameState = GAMEOVER,
  mouseThrust = false,
  mouseTop = 0,
  mouseBottom = 0,
  score = 0,
  time = 0,
  lander = new Lander(),
  landscape = new Landscape(),
  testPoints = [],
  // canvas element and 2D context
  canvas = document.createElement("canvas"),
  context = canvas.getContext("2d"),
  // to store the current x and y mouse position
  mouseX = 0,
  mouseY = 0,
  stats = new Stats(),
  // to convert from degrees to radians,
  // multiply by this number!
  TO_RADIANS = Math.PI / 180,
  view = { x: 0, y: 0, scale: 1, left: 0, right: 0, top: 0, bottom: 0 },
  zoomedIn = false,
  zoomFactor = 4;

window.addEventListener("load", init);

function init() {
  // initWebSocket();
  // CANVAS SET UP

  document.body.appendChild(canvas);

  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = SCREEN_HEIGHT - 45 + "px";
  //document.body.appendChild( stats.domElement );

  infoDisplay = new InfoDisplay(SCREEN_WIDTH, SCREEN_HEIGHT);
  document.body.appendChild(infoDisplay.domElement);

  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;

  document.body.addEventListener("mousedown", onMouseDown);
  document.body.addEventListener("mousemove", onMouseMove);
  document.body.addEventListener("touchstart", onTouchStart);

  KeyTracker.addKeyDownListener(KeyTracker.UP, function () {
    if (gameState == PLAYING) lander.thrust(1);
  });
  KeyTracker.addKeyUpListener(KeyTracker.UP, function () {
    lander.thrust(0);
  });

  window.addEventListener("resize", resizeGame);
  window.addEventListener("orientationchange", resizeGame);

  resizeGame();
  restartLevel();

  loop();
}

function sendPosition() {
  if (gameState == PLAYING) {
    var update = {
      type: "update",
      id: wsID,
      x: Math.round(lander.pos.x * 100),
      y: Math.round(lander.pos.y * 100),
      a: Math.round(lander.rotation),
      t: lander.thrusting,
    };

    sendObject(update);
  }
}

function sendLanded() {
  var update = {
    type: "land",
    x: Math.round(lander.pos.x * 100),
    y: Math.round(lander.pos.y * 100),
    id: wsID,
  };
  sendObject(update);
}

function sendCrashed() {
  var update = {
    type: "crash",
    x: Math.round(lander.pos.x * 100),
    y: Math.round(lander.pos.y * 100),
    id: wsID,
  };
  sendObject(update);
}
function sendGameOver() {
  var update = {
    type: "over",
    x: Math.round(lander.pos.x * 100),
    y: Math.round(lander.pos.y * 100),
    id: wsID,
    sc: score,
  };
  sendObject(update);
}
function sendRestart() {
  var update = {
    type: "restart",
    id: wsID,
    sc: score,
  };
  sendObject(update);
  sendLocation();
}

//

function loop() {
  requestAnimationFrame(loop);

  skippedFrames = 0;

  counter++;
  var c = context;

  var elapsedTime = Date.now() - gameStartTime;
  var elapsedFrames = Math.floor(elapsedTime / mpf);
  var renderedTime = counter * mpf;

  if (elapsedFrames < counter) {
    // c.fillStyle = 'green';
    // 		c.fillRect(0,0,10,10);
    counter--;
    return;
  }

  while (elapsedFrames > counter) {
    lander.update();
    if (counter % 6 == 0) {
      // sendPosition();
    }

    counter++;

    skippedFrames++;
    if (skippedFrames > 30) {
      //set to paused
      counter = elapsedFrames;
    }
  }

  //stats.update();

  if (gameState == PLAYING) {
    checkKeys();
    if (touchable) {
      if (touchController.rightTouch.touching) {
        //console.log(touchController.rightTouch.getY());
        //console.log(map(touchController.rightTouch.getY(), SCREEN_HEIGHT*touchThrustBottom, SCREEN_HEIGHT*touchThrustTop));
        lander.thrust(
          map(
            touchController.rightTouch.getY(),
            SCREEN_HEIGHT * touchThrustBottom,
            SCREEN_HEIGHT * touchThrustTop,
            0,
            1,
            true
          )
        );
      } else {
        lander.thrust(0);
      }

      if (touchController.leftTouch.touching) {
        if (!touchRotate) {
          touchRotate = true;
          touchRotateStartAngle = lander.rotation;
        }
        //				console.log(map(touchController.leftTouch.getX(), SCREEN_WIDTH*touchRotateLeft, SCREEN_WIDTH*touchRotateRight, -90,90,true));
        var touchAngle = map(
          touchController.leftTouch.getXOffset(),
          SCREEN_WIDTH * touchRotateRange * -0.5,
          SCREEN_WIDTH * touchRotateRange * 0.5,
          -90,
          90
        );
        touchAngle += touchRotateStartAngle;

        lander.setRotation(touchAngle);
      } else {
        touchRotate = false;
      }
    }
  }

  lander.update();
  if (counter % 6 == 0) {
    // sendPosition();
  }

  if (gameState == WAITING && lander.altitude < 0 /*100 */) {
    gameState = GAMEOVER;
    restartLevel();
  }

  if (gameState == PLAYING || gameState == WAITING) checkCollisions();

  updateView();
  render();
  if (!mouseHidden && Date.now() - lastMouseMove > 1000) {
    document.body.style.cursor = "none";
    lastMouseHide = Date.now();
    mouseHidden = true;
  }
}

function render() {
  var c = context;

  //c.fillStyle="rgba(0,0,0, 0.4)";
  //c.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  c.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

  //c.fillRect(lander.left, lander.top, lander.right-lander.left, lander.bottom-lander.top);
  // if(skippedFrames>0) {
  // 		c.fillStyle = 'green';
  // 		c.fillRect(0,0,10*skippedFrames,10);
  // 	}

  c.save();
  c.translate(view.x, view.y);
  c.scale(view.scale, view.scale);

  // THIS CODE SHOWS THE VIEWPORT
  // c.beginPath();
  // 	c.moveTo(view.left+2, view.top+2);
  // 	c.lineTo(view.right-2, view.bottom-2);
  // 	c.strokeStyle = 'blue';
  // 	c.lineWidth = 2;
  // 	c.rect(view.left, view.top, view.right-view.left, view.bottom-view.top);
  // 	c.stroke();
  //
  //   console.log("render", context, view.scale);

  landscape.render(context, view);
  lander.render(context, view.scale);

  // for(var i =0; i<testPoints.length; i++) {
  // 		c.fillRect(testPoints[i].x, testPoints[i].y, 1,1);
  // 	}

  if (counter % 4 == 0) updateTextInfo();

  c.restore();
  // c.strokeStyle = 'white';
  // 	c.beginPath();
  // 	c.moveTo(0,mouseTop+HALF_HEIGHT);
  // 	c.lineTo(50,mouseTop+HALF_HEIGHT);
  // 	c.moveTo(0,mouseBottom+HALF_HEIGHT);
  // 	c.lineTo(50,mouseBottom+HALF_HEIGHT);
  // 	c.stroke();

  if (touchable && gameState == PLAYING) {
    //touchController.render(context);

    if (touchController.active) {
      context.strokeStyle = "white";
      context.lineWidth = 1;

      // draws the thrust controls
      var rightX = SCREEN_WIDTH * 0.9;
      if (touchController.rightTouch.getX() != 0) {
        context.beginPath();
        context.moveTo(SCREEN_HEIGHT * touchThrustBottom, rightX);
        context.lineTo(SCREEN_HEIGHT * touchThrustTop, rightX);
        for (var i = 0; i <= 20; i++) {
          context.moveTo(
            rightX - 5,
            map(
              i,
              0,
              20,
              SCREEN_HEIGHT * touchThrustBottom,
              SCREEN_HEIGHT * touchThrustTop
            )
          );
          context.lineTo(
            rightX + 5,
            map(
              i,
              0,
              20,
              SCREEN_HEIGHT * touchThrustBottom,
              SCREEN_HEIGHT * touchThrustTop
            )
          );
        }

        //	if(touchController.rightTouch.touching) {

        var indicatorY = map(
          lander.thrustLevel,
          1,
          0,
          SCREEN_HEIGHT * touchThrustTop,
          SCREEN_HEIGHT * touchThrustBottom
        );
        context.moveTo(rightX - SCREEN_WIDTH * 0.1, indicatorY);
        context.lineTo(rightX - 5, indicatorY);
        context.moveTo(rightX - 5, indicatorY - 5);
        context.lineTo(rightX - 5, indicatorY + 5);

        context.stroke();

        //context.strokeRect(rightX-SCREEN_WIDTH*0.04, map(0.5, 0,1, SCREEN_HEIGHT*touchThrustTop,SCREEN_HEIGHT*touchThrustBottom), SCREEN_WIDTH*0.08,SCREEN_HEIGHT*0.05);
        context.beginPath();
        context.arc(
          rightX - SCREEN_WIDTH * 0.12,
          indicatorY,
          SCREEN_WIDTH * 0.01,
          0,
          Math.PI * 2,
          true
        );
        context.stroke();
        //	}
      }

      //draws rotation controls
      if (touchController.leftTouch.getX() != 0) {
        if (touchController.leftTouch.touching) rotateDialBrightness = 100;
        else rotateDialBrightness *= 0.95;
        context.beginPath();
        context.strokeStyle = "hsl(0,0%," + rotateDialBrightness + "%)";

        for (var i = -180; i <= 0; i += 10) {
          context.save();
          context.translate(
            touchController.leftTouch.getX(),
            touchController.leftTouch.getY()
          );
          context.rotate((i * Math.PI) / 180);
          context.moveTo(55, 0);
          context.lineTo(60, 0);
          context.restore();
        }

        context.save();
        context.translate(
          touchController.leftTouch.getX(),
          touchController.leftTouch.getY()
        );

        context.moveTo(80, -10);
        context.lineTo(90, 0);
        context.lineTo(80, 10);
        context.closePath();

        context.moveTo(-80, -10);
        context.lineTo(-90, 0);
        context.lineTo(-80, 10);
        context.closePath();

        context.rotate(((lander.rotation - 90) * Math.PI) / 180);

        context.moveTo(70, -7);
        context.lineTo(77, 0);
        context.lineTo(70, 7);
        context.closePath();

        context.restore();

        context.stroke();
      }
    }
  }
}

function checkKeys() {
  if (KeyTracker.isKeyDown(leftKey) || KeyTracker.isKeyDown(KeyTracker.LEFT)) {
    lander.rotate(-1);
  } else if (
    KeyTracker.isKeyDown(rightKey) ||
    KeyTracker.isKeyDown(KeyTracker.RIGHT)
  ) {
    lander.rotate(1);
  }
  if (KeyTracker.isKeyDown(abortKey)) {
    lander.abort();
  }

  // SPEED MODE!
  if (KeyTracker.isKeyDown("S")) {
    for (var i = 0; i < 3; i++) lander.update();
  }
}

function updateView() {
  var zoomamount = 0,
    marginx = SCREEN_WIDTH * 0.2,
    margintop = SCREEN_HEIGHT * 0.2,
    marginbottom = SCREEN_HEIGHT * 0.3;

  if (!zoomedIn && lander.altitude < 70) {
    setZoom(true);
  } else if (zoomedIn && lander.altitude > 160) {
    setZoom(false);
  }

  zoomamount = view.scale;

  if (lander.pos.x * zoomamount + view.x < marginx) {
    view.x = -(lander.pos.x * zoomamount) + marginx;
  } else if (lander.pos.x * zoomamount + view.x > SCREEN_WIDTH - marginx) {
    view.x = -(lander.pos.x * zoomamount) + SCREEN_WIDTH - marginx;
  }

  if (lander.pos.y * zoomamount + view.y < margintop) {
    view.y = -(lander.pos.y * zoomamount) + margintop;
  } else if (
    lander.pos.y * zoomamount + view.y >
    SCREEN_HEIGHT - marginbottom
  ) {
    view.y = -(lander.pos.y * zoomamount) + SCREEN_HEIGHT - marginbottom;
  }

  view.left = -view.x / view.scale;
  view.top = -view.y / view.scale;
  view.right = view.left + SCREEN_WIDTH / view.scale;
  view.bottom = view.top + SCREEN_HEIGHT / view.scale;
}

function setLanded(line) {
  multiplier = line.multiplier;

  lander.land();

  var points = 0;
  if (lander.vel.y < 0.075) {
    points = 50 * multiplier;
    // show message - "a perfect landing";
    infoDisplay.showGameInfo(
      "CONGRATULATIONS<br>A PERFECT LANDING\n" + points + " POINTS"
    );
    lander.fuel += 50 * multiplier;
  } else {
    points = 15 * multiplier;
    // YOU LANDED HARD
    infoDisplay.showGameInfo(
      "YOU LANDED HARD<br>YOU ARE HOPELESSLY MAROONED<br>" + points + " POINTS"
    );
    lander.makeBounce();
  }

  score += points;

  // TODO Show score
  gameState = LANDED;
  //ARCADE AMENDMENT
  if (singlePlayMode) {
    setGameOver();
  }
  sendLanded();
  scheduleRestart();
}

function setCrashed() {
  lander.crash();

  // show crashed message
  // subtract fuel

  var fuellost = Math.round(Math.random() * 200 + 200);
  lander.fuel -= fuellost;

  sendCrashed();

  if (lander.fuel < 1) {
    setGameOver();
    msg = "OUT OF FUEL<br><br>GAME OVER";
  } else {
    var rnd = Math.random();
    var msg = "";
    if (rnd < 0.3) {
      msg = "YOU JUST DESTROYED A 100 MEGABUCK LANDER";
    } else if (rnd < 0.6) {
      msg = "DESTROYED";
    } else {
      msg = "YOU CREATED A TWO MILE CRATER";
    }

    msg =
      "AUXILIARY FUEL TANKS DESTROYED<br>" +
      fuellost +
      " FUEL UNITS LOST<br><br>" +
      msg;

    gameState = CRASHED;
    //ARCADE AMENDMENT
    if (singlePlayMode) {
      setGameOver();
    }
  }

  infoDisplay.showGameInfo(msg);

  scheduleRestart();

  samples.explosion.play();
}

function setGameOver() {
  gameState = GAMEOVER;
  sendGameOver();
}

function onMouseDown(e) {
  e.preventDefault();
  if (gameState == WAITING) newGame();
}

function onTouchStart(e) {
  e.preventDefault();
  if (gameState == WAITING) newGame();
}

function newGame() {
  lander.fuel = 1000;

  time = 0;
  score = 0;

  gameStartTime = Date.now();
  counter = 0;

  restartLevel();
}

function scheduleRestart() {
  setTimeout(restartLevel, 4000);
}
function restartLevel() {
  lander.reset();
  landscape.setZones();
  setZoom(false);

  if (gameState == GAMEOVER) {
    gameState = WAITING;
    showStartMessage();
    lander.vel.x = 2;

    //initGame();
  } else {
    gameState = PLAYING;
    sendRestart();
    infoDisplay.hideGameInfo();
  }
  // setTimeout(() => {
  //   samples.explosion.play();
  // }, 100);
}
function checkCollisions() {
  var lines = landscape.lines,
    right = lander.right % landscape.tileWidth,
    left = lander.left % landscape.tileWidth;

  while (right < 0) {
    right += landscape.tileWidth;
    left += landscape.tileWidth;
  }
  let previousY = 600;
  for (var i = 0; i < lines.length; i++) {
    line = lines[i];
    line.checked = false;
    // if the ship overlaps this line
    if (!(right < line.p1.x || left > line.p2.x) && line.p1.y <= previousY) {
      lander.altitude = line.p1.y - lander.bottom;
      line.checked = true;
      previousY = line.p1.y;

      // if the line's horizontal
      if (line.landable) {
        // and the lander's bottom is overlapping the line
        if (lander.bottom >= line.p1.y) {
          //console.log('lander overlapping ground');
          // and the lander is completely within the line
          if (left > line.p1.x && right < line.p2.x) {
            //console.log('lander within line', lander.rotation, lander.vel.y);
            // and we're horizontal and moving slowly
            if (lander.rotation == 0 && lander.vel.y < 0.15) {
              //console.log('horizontal and slow');
              setLanded(line);
            } else {
              setCrashed();
            }
          } else {
            // if we're not within the line
            setCrashed();
          }
        }
        // if lander's bottom is below either of the two y positions
      } else if (lander.bottom > line.p2.y || lander.bottom > line.p1.y) {
        lander.bottomRight.x = right;
        lander.bottomLeft.x = left;

        if (
          pointIsLessThanLine(lander.bottomLeft, line.p1, line.p2) ||
          pointIsLessThanLine(lander.bottomRight, line.p1, line.p2)
        ) {
          setCrashed();
        }
      }
    }
  }
}

function pointIsLessThanLine(point, linepoint1, linepoint2) {
  // so where is the y of the line at the point of the corner?
  // first of all find out how far along the xaxis the point is
  var dist = (point.x - linepoint1.x) / (linepoint2.x - linepoint1.x);
  var yhitpoint = linepoint1.y + (linepoint2.y - linepoint1.y) * dist;
  //	addTestPoint(point.x, yhitpoint);
  return dist > 0 && dist < 1 && yhitpoint <= point.y;
}
//
// function addTestPoint(x, y) {
//
// 	testPoints.push(new Vector2(x,y));
// 	if(testPoints.length>2) testPoints.shift();
//
// }
function updateTextInfo() {
  infoDisplay.updateBoxInt("score", score, 4);
  infoDisplay.updateBoxInt("fuel", lander.fuel, 4);
  if (gameState == PLAYING) infoDisplay.updateBoxTime("time", counter * mpf);

  infoDisplay.updateBoxInt("alt", lander.altitude < 0 ? 0 : lander.altitude, 4);
  infoDisplay.updateBoxInt("horizSpeed", lander.vel.x * 200);
  infoDisplay.updateBoxInt("vertSpeed", lander.vel.y * 200);

  // +(lander.vel.x<0)?' ‹':' ›'
  // +(lander.vel.y<0)?' ˆ':' >'

  if (lander.fuel < 300 && gameState == PLAYING) {
    if (counter % 50 < 30) {
      var playBeep;
      if (lander.fuel <= 0) {
        playBeep = infoDisplay.showGameInfo("Out of fuel");
      } else {
        playBeep = infoDisplay.showGameInfo("Low on fuel");
      }
      if (playBeep) samples.beep.play();
    } else {
      infoDisplay.hideGameInfo();
    }
  }
}

function showStartMessage() {
  // add logo svg to canvas
  infoDisplay.showGameInfo(startMessage);
  //
  const svg = document.createElement("div");
  svg.innerHTML = `<svg version="1.0" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="140.7px" height="121.8px" viewBox="0 0 140.7 121.8" style="enable-background:new 0 0 140.7 121.8;" xml:space="preserve"
	>
<style type="text/css">
	.st0{fill:#00ff00;}
</style>
<g>
	<g>
		<g>
			<path class="st0" d="M66.1,77.7c-1,0.9-2.1,1.5-3.4,1.6c-1.2,0.2-2.7,0.3-4.2,0.3h-4.2l0,14l-3.8,0l0-33l7.7,0l2.1,0
				c2.9,0,5,0.8,6.5,2.4c1.5,1.6,2.2,4,2.2,7.1C69.1,73.4,68.1,76,66.1,77.7z M64.8,67.4c-0.2-0.7-0.6-1.2-1.1-1.7
				c-0.5-0.4-1.1-0.7-1.8-0.9c-0.7-0.2-1.6-0.3-2.5-0.3h-5.1l0,11.2h4.8c1,0,1.8-0.1,2.6-0.3c0.7-0.2,1.4-0.5,1.9-0.9
				c0.5-0.4,0.9-1,1.1-1.8c0.3-0.7,0.4-1.7,0.4-2.8C65.1,69,65,68.1,64.8,67.4z"/>
			<path class="st0" d="M85.4,64.6l0,29l-3.8,0l0-29l-8.6,0l0-4l21.1,0l0,4L85.4,64.6z"/>
		</g>
		<path class="st0" d="M140.7,121.8H90.9v-2h46.4L114,79.7l1.7-1L140.7,121.8z M49.8,121.8H0l24.9-43.2l1.7,1L3.5,119.8h46.4V121.8z
			 M90,38L70.3,4L50.7,38L49,37L70.3,0l21.4,37L90,38z"/>
	</g>
</g>
</svg>`;
  const title = document.querySelector(".titleBox");
  title.insertBefore(svg, title.firstChild);
}

function setZoom(zoom) {
  if (zoom) {
    view.scale = (SCREEN_HEIGHT / 700) * 5;
    zoomedIn = true;
    view.x = -lander.pos.x * view.scale + SCREEN_WIDTH / 2;
    view.y = -lander.pos.y * view.scale + SCREEN_HEIGHT * 0.25;
    lander.scale = 0.25;
  } else {
    view.scale = SCREEN_HEIGHT / 700;
    zoomedIn = false;
    lander.scale = 0.6;
    view.x = 0;
    view.y = 0;
  }
  /*
	for (var id in players) { 
		var player = players[id]; 
		player.scale = lander.scale; 
	}*/
}

// returns a random number between the two limits provided
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

function map(value, min1, max1, min2, max2, clamp) {
  clamp = typeof clamp !== "undefined" ? clamp : false;

  if (clamp) {
    if (min1 > max1) {
      var tmp = min1;
      min1 = max1;
      max1 = tmp;
      tmp = min2;
      min2 = max2;
      max2 = tmp;
    }
    if (value <= min1) return min2;
    else if (value >= max1) return max2;
  }

  return ((value - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

function onMouseMove(event) {
  mouseX = event.clientX - HALF_WIDTH;
  mouseY = event.clientY - HALF_HEIGHT;
  if (mouseHidden && Date.now() - lastMouseHide > 400) {
    document.body.style.cursor = "default";

    mouseHidden = false;
    //	console.log("mouse move "+ canvas.style.cursor);
  }
  lastMouseMove = Date.now();
}

function resizeGame(event) {
  var newWidth = window.innerWidth;
  var newHeight = window.innerHeight;

  if (SCREEN_WIDTH == newWidth && SCREEN_HEIGHT == newHeight) return;
  if (touchable) window.scrollTo(0, -10);

  SCREEN_WIDTH = canvas.width = newWidth;
  SCREEN_HEIGHT = canvas.height = newHeight;

  setZoom(zoomedIn);
  stats.domElement.style.top = SCREEN_HEIGHT - 45 + "px";
  infoDisplay.arrangeBoxes(SCREEN_WIDTH, SCREEN_HEIGHT);
}
