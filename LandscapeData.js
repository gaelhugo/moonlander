function Landscape() {
  var points = (this.points = []),
    lines = (this.lines = []),
    stars = (this.stars = []),
    availableZones = [],
    zoneCombis = [],
    currentCombi = 0,
    zoneInfos = [],
    landscale = 1.4,
    rightedge,
    flickerProgress = 0;

  setupData();

  rightedge = this.tileWidth = points[points.length - 1].x * landscale;

  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    p.x *= landscale;
    p.y *= landscale;
    // p.y += 50;
  }

  for (var i = 1; i < points.length; i++) {
    var p1 = points[i - 1];
    var p2 = points[i];
    lines.push(new LandscapeLine(p1, p2));
  }

  // make stars...

  for (var i = 0; i < lines.length; i++) {
    if (Math.random() < 0.1) {
      var line = lines[i];

      var star = { x: line.p1.x, y: Math.random() * 600 };

      if (star.y < line.p1.y && star.y < line.p2.y) {
        stars.push(star);
      }
    }
  }

  //	var pointcount = points.length;

  //var dirtyRectangles = [];

  var render = (this.render = function (c, view) {
    var offset = 0;

    while (view.left - offset > rightedge) {
      offset += rightedge;
    }

    while (view.left - offset < 0) {
      offset -= rightedge;
    }

    var startOffset = offset;

    var i = 0;

    while (lines[i].p2.x + offset < view.left) {
      i++;
      if (i > lines.length) {
        i = 0;
        offset += rightedge;
      }
    }

    c.beginPath();

    var line = lines[i];
    var offsetY = 0;
    if (Math.random() < 0.3) {
      offset += 0.2 / view.scale;
      offsetY = 0.2 / view.scale;
    }
    c.moveTo(line.p1.x + offset, line.p1.y + offsetY);

    var zoneInfoIndex = 0;

    while ((line = lines[i]).p1.x + offset < view.right * 2) {
      var point = line.p2;
      c.lineTo(point.x + offset, point.y);

      if (counter % 20 > 10 && line.multiplier != 1) {
        var infoBox;

        if (!zoneInfos[zoneInfoIndex]) {
          infoBox = zoneInfos[zoneInfoIndex] = new InfoBox(1, 50);
          document.body.appendChild(infoBox.domElement);
        } else {
          infoBox = zoneInfos[zoneInfoIndex];
          infoBox.show();
        }
        infoBox.setText(line.multiplier + "x");
        infoBox.setX(
          ((line.p2.x - line.p1.x) / 2 + line.p1.x + offset) * view.scale +
            view.x
        );
        infoBox.setY((line.p2.y + 2) * view.scale + view.y);
        zoneInfoIndex++;
      }

      i++;
      if (i >= lines.length) {
        i = 0;
        offset += rightedge;
      }
    }

    var flickerAmount = Math.sin(counter * 0.8) * 0.5 + 0.5;

    if (flickerAmount > 0.5) {
      c.lineWidth = 2 / view.scale;
      var channel = Math.round((flickerAmount - 0.5) * 100);
      c.strokeStyle = "rgb(" + channel + "," + channel + "," + channel + ")";
      c.stroke();
    }
    c.strokeStyle = "rgb(0,255,0)";

    c.lineWidth = (1 / view.scale) * (flickerAmount * 0.2 + 0.8);
    c.lineJoin = "bevel";
    c.stroke();

    for (var i = zoneInfoIndex; i < zoneInfos.length; i++) {
      zoneInfos[i].hide();
    }

    // draw stars :

    i = 0;
    offset = startOffset;

    while (stars[i].x + offset < view.left) {
      i++;
      if (i >= stars.length) {
        i = 0;
        offset += rightedge;
      }
    }

    c.beginPath();

    while ((star = stars[i]).x + offset < view.right) {
      var starx = star.x + offset;
      var stary = star.y;
      while (view.bottom < stary) stary -= 600;

      c.rect(starx, stary, 1 / view.scale, 1 / view.scale);
      if (stary - 600 > view.top) {
        stary -= 600;
        c.rect(starx, stary, 1 / view.scale, 1 / view.scale);
      }

      i++;
      if (i >= stars.length) {
        i = 0;
        offset += rightedge;
      }
    }

    c.stroke();

    //code to check landable...
    // c.beginPath();
    // for(var i=0; i<lines.length; i++) {
    // 	var line = lines[i];
    // 	if(line.checked) {
    // 		c.moveTo(line.p1.x, line.p1.y);
    // 		c.lineTo(line.p2.x, line.p2.y);
    //
    // 		if(line.p2.x+rightedge < view.right) {
    // 				c.moveTo(line.p1.x+rightedge, line.p1.y);
    // 				c.lineTo(line.p2.x+rightedge, line.p2.y);
    //
    // 		}
    // 	}
    // }
    // c.strokeStyle = 'red';
    // c.stroke();
  });

  this.setZones = function () {
    for (var i = 0; i < lines.length; i++) {
      lines[i].multiplier = 1;
    }

    var combi = zoneCombis[currentCombi];

    for (var i = 0; i < combi.length; i++) {
      var zonenumber = combi[i];
      var zone = availableZones[zonenumber];
      line = lines[zone.lineNum];

      // var zoneLabel : TextDisplay = zoneLabels[i];
      // 		zoneLabel.x = line.p1.x + ((line.p2.x - line.p1.x) / 2);
      // 		zoneLabel.y = line.p1.y;
      // 		zoneLabel.text = zone.multiplier + "X";
      line.multiplier = zone.multiplier;
    }

    currentCombi++;
    if (currentCombi >= zoneCombis.length) currentCombi = 0;
  };

  function setupData() {
    // TOUS LES POINTS DU PAYSAGE. IL FAUT DES PLATS POUR FAIRE ATTERRIR LE VAISSEAU
    // points.push(new Vector2(0.5, 355.55));
    // points.push(new Vector2(5.45, 355.55));
    // points.push(new Vector2(6.45, 359.4));
    // points.push(new Vector2(11.15, 359.4));
    // points.push(new Vector2(12.1, 363.65));
    // points.push(new Vector2(14.6, 363.65));
    // points.push(new Vector2(15.95, 375.75));
    // points.push(new Vector2(19.25, 388));
    // points.push(new Vector2(19.25, 391.9));
    // points.push(new Vector2(21.65, 400));
    // points.push(new Vector2(28.85, 404.25));
    // points.push(new Vector2(30.7, 412.4));
    // points.push(new Vector2(33.05, 416.7));
    // points.push(new Vector2(37.9, 420.5));
    // points.push(new Vector2(42.7, 420.5));
    // points.push(new Vector2(47.4, 416.65));
    // points.push(new Vector2(51.75, 409.5));
    // points.push(new Vector2(56.55, 404.25));
    // points.push(new Vector2(61.3, 400));
    // points.push(new Vector2(63.65, 396.15));
    // points.push(new Vector2(68, 391.9));
    // points.push(new Vector2(70.3, 388));
    // points.push(new Vector2(75.1, 386.1));
    // points.push(new Vector2(79.85, 379.95));
    // points.push(new Vector2(84.7, 378.95));
    // points.push(new Vector2(89.05, 375.65));
    // points.push(new Vector2(93.75, 375.65));
    // points.push(new Vector2(98.5, 376.55));
    // points.push(new Vector2(103.2, 379.95));
    // points.push(new Vector2(104.3, 383.8));
    // points.push(new Vector2(107.55, 388));
    // points.push(new Vector2(108.95, 391.9));
    // points.push(new Vector2(112.4, 396.15));
    // points.push(new Vector2(113.3, 400));
    // points.push(new Vector2(117.1, 404.25));
    // points.push(new Vector2(121.95, 404.25));
    // points.push(new Vector2(125.3, 396.3));
    // points.push(new Vector2(128.6, 394.2));
    // points.push(new Vector2(132.45, 396.15));
    // points.push(new Vector2(135.75, 399.9));
    // points.push(new Vector2(138.15, 408.15));
    // points.push(new Vector2(144.7, 412.4));
    // points.push(new Vector2(146.3, 424.8));
    // points.push(new Vector2(149.55, 436.65));
    // points.push(new Vector2(149.55, 441.05));
    // points.push(new Vector2(154.35, 444.85));
    // points.push(new Vector2(163.45, 444.85));
    // points.push(new Vector2(168.15, 441.05));
    // points.push(new Vector2(172.95, 436.75));
    // points.push(new Vector2(175.45, 432.9));
    // points.push(new Vector2(179.7, 428.6));
    // points.push(new Vector2(181.95, 424.8));
    // points.push(new Vector2(186.7, 422.5));
    // points.push(new Vector2(189.15, 412.4));
    // points.push(new Vector2(191.55, 404.35));
    // points.push(new Vector2(196.35, 402.4));
    // points.push(new Vector2(200.7, 398.1));
    // points.push(new Vector2(205.45, 391.9));
    // points.push(new Vector2(210.15, 383.8));
    // points.push(new Vector2(212.55, 375.75));
    // points.push(new Vector2(216.85, 371.8));
    // points.push(new Vector2(219.3, 367.55));
    // points.push(new Vector2(220.65, 363.65));
    // points.push(new Vector2(224, 359.4));
    // points.push(new Vector2(228.8, 359.4));
    // points.push(new Vector2(233.55, 355.55));
    // points.push(new Vector2(237.85, 348.45));
    // points.push(new Vector2(242.65, 343.2));
    // points.push(new Vector2(245, 335.15));
    // points.push(new Vector2(247.35, 322.8));
    // points.push(new Vector2(247.3, 314.5));
    // points.push(new Vector2(248.35, 306.55));
    // points.push(new Vector2(252.2, 296.5));
    // points.push(new Vector2(256.55, 294.55));
    // points.push(new Vector2(257.95, 290.4));
    // points.push(new Vector2(261.25, 285.95));
    // points.push(new Vector2(265.95, 285.95));
    // points.push(new Vector2(267, 290.25));
    // points.push(new Vector2(271.75, 290.25));
    // points.push(new Vector2(273.25, 294.55));
    // points.push(new Vector2(275.2, 294.55));
    // points.push(new Vector2(278.95, 296.5));
    // points.push(new Vector2(282.25, 300.3));
    // points.push(new Vector2(284.7, 308.45));
    // points.push(new Vector2(291.85, 312.65));
    // points.push(new Vector2(298.55, 330.8));
    // points.push(new Vector2(303.25, 331.8));
    // points.push(new Vector2(308, 335.05));
    // points.push(new Vector2(309, 338.9));
    // points.push(new Vector2(312.35, 343.2));
    // points.push(new Vector2(313.8, 347.05));
    // points.push(new Vector2(317.05, 351.4));
    // points.push(new Vector2(321.9, 351.4));
    // points.push(new Vector2(322.85, 363.8));
    // points.push(new Vector2(326.6, 375.75));
    // points.push(new Vector2(326.6, 379.95));
    // points.push(new Vector2(330.9, 379.95));
    // points.push(new Vector2(332.4, 383.8));
    // points.push(new Vector2(335.8, 388));
    // points.push(new Vector2(338.1, 396.15));
    // points.push(new Vector2(340.45, 400.1));
    // points.push(new Vector2(345.3, 404.25));
    // points.push(new Vector2(346.25, 416.65));
    // points.push(new Vector2(349.6, 428.7));
    // points.push(new Vector2(349.6, 432.85));
    // points.push(new Vector2(350.95, 436.75));
    // points.push(new Vector2(354.3, 441.05));
    // points.push(new Vector2(359, 441.05));
    // points.push(new Vector2(361.4, 449.1));
    // points.push(new Vector2(363.95, 453));
    // points.push(new Vector2(368.2, 457.2));
    // // ici le plateau 2x
    // points.push(new Vector2(372.9, 461));
    // points.push(new Vector2(410.2, 461));
    // // fin plateau 2x
    // points.push(new Vector2(412.55, 449.1));
    // points.push(new Vector2(417.4, 441.05));
    // points.push(new Vector2(419.7, 432.9));
    // points.push(new Vector2(422.05, 432.9));
    // points.push(new Vector2(425.45, 424.8));
    // points.push(new Vector2(428.8, 422.35));
    // points.push(new Vector2(433.45, 416.65));
    // points.push(new Vector2(438.25, 415.15));
    // points.push(new Vector2(442.6, 412.4));
    // points.push(new Vector2(447.4, 412.4));
    // points.push(new Vector2(448.8, 416.65));
    // points.push(new Vector2(454.55, 430.55));
    // points.push(new Vector2(455.5, 434.8));
    // points.push(new Vector2(459.25, 438.6));
    // points.push(new Vector2(462.6, 440.9));
    // points.push(new Vector2(466, 444.85));
    // points.push(new Vector2(468.35, 452.9));
    // points.push(new Vector2(475.55, 457.3));
    // points.push(new Vector2(484.7, 457.3));
    // points.push(new Vector2(494.7, 458.2));
    // points.push(new Vector2(503.75, 461.1));
    // points.push(new Vector2(522.2, 461.1));
    // points.push(new Vector2(524.75, 453));
    // points.push(new Vector2(527.1, 441.05));
    // points.push(new Vector2(527.1, 432.9));
    // points.push(new Vector2(531.9, 432.9));
    // points.push(new Vector2(534.15, 424.8));
    // points.push(new Vector2(538.6, 420.5));
    // points.push(new Vector2(540.9, 416.65));
    // points.push(new Vector2(542.35, 412.5));
    // points.push(new Vector2(545.7, 408));
    // points.push(new Vector2(550.45, 408));
    // points.push(new Vector2(552.85, 398.1));
    // points.push(new Vector2(554.75, 389.95));
    // points.push(new Vector2(559.55, 388));
    // points.push(new Vector2(564.35, 391.9));
    // points.push(new Vector2(573.35, 391.9));
    // points.push(new Vector2(578.1, 388));
    // points.push(new Vector2(579.55, 379.95));
    // points.push(new Vector2(582.9, 369.4));
    // points.push(new Vector2(587.75, 367.55));
    // points.push(new Vector2(588.65, 363.8));
    // points.push(new Vector2(592.05, 359.5));
    // points.push(new Vector2(596.85, 355.55));

    points.push(new Vector2(0.0, 391.1));
    points.push(new Vector2(14.9, 391.0));
    points.push(new Vector2(16.9, 376.0));
    points.push(new Vector2(23.9, 368.0));
    points.push(new Vector2(22.9, 346.0));
    points.push(new Vector2(29.9, 298.0));
    points.push(new Vector2(28.9, 290.0));
    points.push(new Vector2(32.9, 285.0));
    points.push(new Vector2(32.9, 280.0));
    points.push(new Vector2(34.9, 278.0));
    points.push(new Vector2(35.5, 263.0));
    points.push(new Vector2(35.9, 252.0));
    points.push(new Vector2(38.9, 252.0));
    points.push(new Vector2(42.9, 208.0));
    points.push(new Vector2(44.5, 207.0));
    points.push(new Vector2(47.5, 177.0));
    points.push(new Vector2(51.5, 177.0));
    points.push(new Vector2(56.5, 173.0));
    points.push(new Vector2(58.5, 171.0));
    points.push(new Vector2(141.0, 141.0));
    points.push(new Vector2(178.0, 115.0));
    points.push(new Vector2(196.0, 115.0));
    points.push(new Vector2(200.5, 106.0));
    points.push(new Vector2(213, 106.0));
    points.push(new Vector2(218.9, 130.0));
    points.push(new Vector2(221.9, 141.0));
    points.push(new Vector2(221.9, 144.0));
    points.push(new Vector2(230.9, 154.0));
    points.push(new Vector2(233.9, 172.0));
    points.push(new Vector2(236.9, 172.0));
    points.push(new Vector2(238.9, 189.0));
    points.push(new Vector2(235.9, 191.0));
    points.push(new Vector2(246.9, 203.0));
    points.push(new Vector2(242.9, 222.0));
    points.push(new Vector2(244.9, 224.0));
    points.push(new Vector2(253.9, 224.0));
    points.push(new Vector2(263.9, 233.0));
    points.push(new Vector2(262.9, 240.0));
    points.push(new Vector2(265.7, 243.0));
    points.push(new Vector2(275.9, 254.0));
    points.push(new Vector2(279.9, 254.0));
    points.push(new Vector2(291.9, 264.0));
    points.push(new Vector2(291.9, 268.0));
    points.push(new Vector2(298.9, 270.0));
    points.push(new Vector2(300.9, 268.0));
    points.push(new Vector2(312.9, 277.0));
    points.push(new Vector2(313.9, 279.0));
    points.push(new Vector2(328.9, 285.0));
    points.push(new Vector2(340.9, 285.0));
    points.push(new Vector2(347.9, 293.0));
    points.push(new Vector2(347.9, 296.0));
    points.push(new Vector2(353.9, 297.0));
    points.push(new Vector2(357.9, 296.0));
    points.push(new Vector2(369.9, 302.0));
    points.push(new Vector2(369.9, 305.0));
    points.push(new Vector2(379.9, 309.0));
    points.push(new Vector2(384.9, 307.0));
    points.push(new Vector2(401.9, 313.0));
    points.push(new Vector2(401.9, 315.0));
    points.push(new Vector2(404.9, 317.0));
    points.push(new Vector2(404.9, 324.0));
    points.push(new Vector2(427.5, 324.0));
    points.push(new Vector2(475.9, 331.0));
    points.push(new Vector2(503.9, 337.0));
    points.push(new Vector2(515.5, 337.0));
    points.push(new Vector2(531.9, 348.0));
    points.push(new Vector2(537.9, 358.0));
    points.push(new Vector2(541.9, 359.0));
    points.push(new Vector2(543.9, 366.0));
    points.push(new Vector2(542.9, 369.0));
    points.push(new Vector2(547.9, 383.0));
    points.push(new Vector2(546.9, 391.0));
    points.push(new Vector2(538.9, 400.0));
    points.push(new Vector2(510.9, 413.0));
    points.push(new Vector2(443.9, 432.0));
    points.push(new Vector2(335.9, 442.0));
    points.push(new Vector2(204.9, 436.0));
    points.push(new Vector2(108.9, 435.0));
    points.push(new Vector2(40.9, 427.0));
    points.push(new Vector2(17.9, 419.0));
    points.push(new Vector2(15.9, 393.0));
    points.push(new Vector2(17.9, 378.0));
    points.push(new Vector2(95.9, 389.0));
    points.push(new Vector2(207.9, 395.0));
    points.push(new Vector2(293.9, 403.0));
    points.push(new Vector2(344.9, 409.0));
    points.push(new Vector2(433.9, 402.0));
    points.push(new Vector2(518.9, 379.0));
    points.push(new Vector2(540.0, 368.0));
    points.push(new Vector2(541.0, 365.0));
    points.push(new Vector2(539.9, 361.0));
    points.push(new Vector2(535.9, 360.0));
    points.push(new Vector2(515.9, 370.0));
    points.push(new Vector2(429.9, 393.0));
    points.push(new Vector2(369.9, 398.0));
    points.push(new Vector2(344.0, 399.0));
    points.push(new Vector2(283.9, 391.0));
    points.push(new Vector2(178.9, 383.0));
    points.push(new Vector2(108.9, 379.0));
    points.push(new Vector2(25.9, 368.0));
    points.push(new Vector2(108.9, 377.0));
    points.push(new Vector2(146.9, 379.0));
    points.push(new Vector2(131.9, 331.0));
    points.push(new Vector2(122.9, 324.0));
    points.push(new Vector2(68.9, 302.0));
    points.push(new Vector2(45.9, 291.0));
    points.push(new Vector2(34.9, 282.0));
    points.push(new Vector2(46.9, 289.0));
    points.push(new Vector2(69.9, 300.0));
    points.push(new Vector2(133.9, 326.0));
    points.push(new Vector2(209.9, 353.0));
    points.push(new Vector2(240.9, 360.0));
    points.push(new Vector2(261.9, 358.0));
    points.push(new Vector2(276.9, 347.0));
    points.push(new Vector2(280.9, 333.0));
    points.push(new Vector2(276.9, 317.0));
    points.push(new Vector2(266.9, 301.0));
    points.push(new Vector2(241.9, 277.0));
    points.push(new Vector2(244.9, 301.0));
    points.push(new Vector2(240.9, 313.0));
    points.push(new Vector2(234.9, 322.0));
    points.push(new Vector2(219.9, 327.0));
    points.push(new Vector2(195.9, 324.0));
    points.push(new Vector2(126.9, 304.0));
    points.push(new Vector2(66.9, 284.0));
    points.push(new Vector2(41.9, 272.0));
    points.push(new Vector2(37.9, 266.0));
    points.push(new Vector2(37.9, 256.0));
    points.push(new Vector2(49.9, 262.0));
    points.push(new Vector2(79.9, 271.0));
    points.push(new Vector2(103.9, 275.0));
    points.push(new Vector2(137.9, 271.0));
    points.push(new Vector2(164.9, 264.0));
    points.push(new Vector2(191.9, 251.2));
    points.push(new Vector2(191.9, 257.0));
    points.push(new Vector2(165.9, 268.0));
    points.push(new Vector2(139.9, 274.1));
    points.push(new Vector2(101.9, 278.0));
    points.push(new Vector2(78.9, 274.0));
    points.push(new Vector2(48.9, 265.0));
    points.push(new Vector2(39.9, 261.0));
    points.push(new Vector2(39.9, 264.0));
    points.push(new Vector2(48.9, 268.0));
    points.push(new Vector2(77.9, 277.0));
    points.push(new Vector2(100.9, 282.0));
    points.push(new Vector2(139.9, 278.0));
    points.push(new Vector2(167.9, 272.0));
    points.push(new Vector2(196.9, 258.0));
    points.push(new Vector2(205.9, 268.0));
    points.push(new Vector2(178.9, 280.0));
    points.push(new Vector2(158.9, 285.0));
    points.push(new Vector2(134.9, 289.0));
    points.push(new Vector2(136.9, 304.0));
    points.push(new Vector2(160.9, 380.0));
    points.push(new Vector2(163.9, 380.0));
    points.push(new Vector2(138.9, 304.0));
    points.push(new Vector2(136.9, 291.0));
    points.push(new Vector2(158.9, 287.0));
    points.push(new Vector2(179.9, 282.0));
    points.push(new Vector2(209.9, 268.0));
    points.push(new Vector2(195.9, 254.0));
    points.push(new Vector2(197.9, 219.0));
    points.push(new Vector2(175.9, 226.0));
    points.push(new Vector2(139.9, 243.0));
    points.push(new Vector2(125.9, 257.0));
    points.push(new Vector2(121.9, 270.0));
    points.push(new Vector2(104.9, 272.0));
    points.push(new Vector2(80.9, 268.0));
    points.push(new Vector2(50.9, 260.0));
    points.push(new Vector2(40.9, 255.0));
    points.push(new Vector2(44.9, 209.0));
    points.push(new Vector2(58.9, 200.0));
    points.push(new Vector2(97.9, 184.0));
    points.push(new Vector2(159.9, 162.0));
    points.push(new Vector2(192.9, 153.0));
    points.push(new Vector2(211.9, 152.0));
    points.push(new Vector2(218.9, 156.0));
    points.push(new Vector2(220.9, 162.0));
    points.push(new Vector2(212.9, 161.0));
    points.push(new Vector2(205.9, 164.0));
    points.push(new Vector2(205.9, 169.0));
    points.push(new Vector2(208.9, 171.0));
    points.push(new Vector2(224.9, 181.0));
    points.push(new Vector2(232.9, 175.0));
    points.push(new Vector2(222.9, 164.0));
    points.push(new Vector2(223.9, 184.0));
    points.push(new Vector2(209.9, 191.0));
    points.push(new Vector2(208.9, 196.0));
    points.push(new Vector2(218.9, 201.0));
    points.push(new Vector2(233.9, 192.0));
    points.push(new Vector2(223.9, 200.0));
    points.push(new Vector2(227.9, 202.0));
    points.push(new Vector2(232.9, 215.0));
    points.push(new Vector2(216.9, 226.0));
    points.push(new Vector2(201.5, 214.0));
    points.push(new Vector2(207.9, 217.0));
    points.push(new Vector2(225.9, 204.0));
    points.push(new Vector2(207.9, 217.0));
    points.push(new Vector2(217.9, 228.7));
    points.push(new Vector2(219.9, 231.0));
    points.push(new Vector2(244.9, 229.0));
    points.push(new Vector2(250.9, 230.0));
    points.push(new Vector2(239.9, 219.0));
    points.push(new Vector2(230.9, 219.0));
    points.push(new Vector2(215.9, 229.0));
    points.push(new Vector2(219.9, 240.0));
    points.push(new Vector2(225.9, 244.0));
    points.push(new Vector2(236.9, 241.0));
    points.push(new Vector2(247.9, 239.0));
    points.push(new Vector2(248.9, 231.0));
    points.push(new Vector2(250.9, 241.0));
    points.push(new Vector2(250.9, 251.0));
    points.push(new Vector2(256.9, 258.0));
    points.push(new Vector2(263.9, 250.0));
    points.push(new Vector2(263.9, 243.0));
    points.push(new Vector2(276.9, 257.0));
    points.push(new Vector2(276.9, 265.0));
    points.push(new Vector2(279.9, 274.0));
    points.push(new Vector2(285.9, 274.0));
    points.push(new Vector2(289.9, 267.0));
    points.push(new Vector2(296.9, 272.0));
    points.push(new Vector2(297.9, 283.0));
    points.push(new Vector2(301.9, 291.0));
    points.push(new Vector2(307.9, 295.0));
    points.push(new Vector2(310.9, 290.0));
    points.push(new Vector2(311.9, 279.0));
    points.push(new Vector2(327.9, 286.0));
    points.push(new Vector2(327.9, 294.0));
    points.push(new Vector2(330.9, 301.0));
    points.push(new Vector2(336.9, 304.0));
    points.push(new Vector2(343.9, 294.0));
    points.push(new Vector2(350.9, 308.0));
    points.push(new Vector2(352.5, 319.0));
    points.push(new Vector2(361.9, 323.0));
    points.push(new Vector2(362.9, 317.0));
    points.push(new Vector2(362.9, 306.0));
    points.push(new Vector2(367.9, 305.0));
    points.push(new Vector2(363.9, 308.0));
    points.push(new Vector2(376.9, 314.0));
    points.push(new Vector2(380.9, 311.0));
    points.push(new Vector2(377.9, 316.0));
    points.push(new Vector2(380.0, 323.4));
    points.push(new Vector2(386.6, 323.4));
    points.push(new Vector2(394.9, 318.0));
    points.push(new Vector2(401.9, 319.0));
    points.push(new Vector2(397.9, 321.0));
    points.push(new Vector2(399.9, 327.0));
    points.push(new Vector2(385.9, 345.0));
    points.push(new Vector2(384.9, 353.0));
    points.push(new Vector2(378.9, 364.0));
    points.push(new Vector2(380.9, 370.0));
    points.push(new Vector2(389.9, 371.0));
    points.push(new Vector2(400.9, 366.0));
    points.push(new Vector2(415.9, 355.0));
    points.push(new Vector2(403.9, 342.0));
    points.push(new Vector2(408.9, 340.0));
    points.push(new Vector2(409.9, 343.0));
    points.push(new Vector2(403.9, 345.0));
    points.push(new Vector2(408.9, 335.0));
    points.push(new Vector2(414.9, 336.0));
    points.push(new Vector2(413.9, 337.0));
    points.push(new Vector2(405.9, 336.0));
    points.push(new Vector2(413.9, 331.0));
    points.push(new Vector2(424.9, 341.0));
    points.push(new Vector2(430.9, 341.0));
    points.push(new Vector2(429.9, 345.0));
    points.push(new Vector2(422.9, 342.0));
    points.push(new Vector2(426.9, 333.0));
    points.push(new Vector2(429.9, 336.0));
    points.push(new Vector2(427.9, 337.0));
    points.push(new Vector2(423.9, 335.0));
    points.push(new Vector2(429.9, 329.0));
    points.push(new Vector2(432.9, 331.0));
    points.push(new Vector2(426.9, 330.0));
    points.push(new Vector2(440.9, 329.0));
    points.push(new Vector2(441.9, 331.0));
    points.push(new Vector2(438.9, 328.0));
    points.push(new Vector2(443.9, 338.0));
    points.push(new Vector2(439.9, 336.0));
    points.push(new Vector2(443.9, 336.0));
    points.push(new Vector2(449.9, 344.0));
    points.push(new Vector2(444.9, 342.0));
    points.push(new Vector2(448.9, 341.0));
    points.push(new Vector2(447.9, 332.0));
    points.push(new Vector2(450.9, 334.0));
    points.push(new Vector2(446.9, 333.0));
    points.push(new Vector2(458.9, 337.0));
    points.push(new Vector2(458.9, 338.0));
    points.push(new Vector2(454.9, 337.0));
    points.push(new Vector2(456.9, 335.0));
    points.push(new Vector2(467.9, 343.0));
    points.push(new Vector2(462.9, 342.0));
    points.push(new Vector2(458.9, 330.0));
    points.push(new Vector2(461.9, 331.0));
    points.push(new Vector2(457.9, 331.0));
    points.push(new Vector2(471.9, 334.0));
    points.push(new Vector2(471.9, 336.0));
    points.push(new Vector2(468.9, 334.0));
    points.push(new Vector2(469.9, 332.0));
    points.push(new Vector2(481.9, 340.0));
    points.push(new Vector2(481.9, 343.0));
    points.push(new Vector2(477.9, 341.0));
    points.push(new Vector2(479.9, 336.0));
    points.push(new Vector2(481.9, 337.0));
    points.push(new Vector2(477.9, 332.0));
    points.push(new Vector2(491.9, 339.0));
    points.push(new Vector2(492.9, 341.0));
    points.push(new Vector2(489.9, 340.0));
    points.push(new Vector2(503.9, 338.0));
    points.push(new Vector2(507.0, 338.0));
    points.push(new Vector2(509.9, 340.0));
    points.push(new Vector2(506.9, 342.0));
    points.push(new Vector2(475.9, 350.0));
    points.push(new Vector2(454.9, 351.0));
    points.push(new Vector2(433.9, 354.0));
    points.push(new Vector2(417.9, 357.0));
    points.push(new Vector2(401.9, 369.0));
    points.push(new Vector2(390.9, 374.0));
    points.push(new Vector2(377.9, 373.0));
    points.push(new Vector2(374.9, 363.0));
    points.push(new Vector2(380.9, 352.0));
    points.push(new Vector2(381.9, 344.0));
    points.push(new Vector2(396.9, 325.0));
    points.push(new Vector2(375.9, 343.0));
    points.push(new Vector2(358.9, 365.0));
    points.push(new Vector2(343.9, 396.0));
    points.push(new Vector2(292.9, 389.0));
    points.push(new Vector2(315.9, 345.0));
    points.push(new Vector2(321.9, 323.0));
    points.push(new Vector2(319.9, 290.0));
    points.push(new Vector2(322.9, 285.0));
    points.push(new Vector2(313.9, 282.0));
    points.push(new Vector2(315.5, 305.0));
    points.push(new Vector2(306.9, 302.0));
    points.push(new Vector2(292.9, 298.0));
    points.push(new Vector2(265.9, 274.0));
    points.push(new Vector2(247.9, 262.0));
    points.push(new Vector2(224.9, 264.0));
    points.push(new Vector2(211.9, 268.0));
    points.push(new Vector2(196.9, 252.0));
    points.push(new Vector2(199.0, 210.0));
    points.push(new Vector2(129.9, 235.0));
    points.push(new Vector2(128.9, 234.0));
    points.push(new Vector2(136.9, 231.0));
    points.push(new Vector2(138.9, 228.0));
    points.push(new Vector2(120.9, 235.0));
    points.push(new Vector2(112.9, 234.0));
    points.push(new Vector2(147.9, 222.0));
    points.push(new Vector2(154.9, 216.0));
    points.push(new Vector2(105.9, 234.0));
    points.push(new Vector2(94.9, 233.0));
    points.push(new Vector2(162.9, 209.0));
    points.push(new Vector2(169.9, 202.0));
    points.push(new Vector2(86.9, 231.0));
    points.push(new Vector2(77.9, 229.0));
    points.push(new Vector2(96.9, 222.0));
    points.push(new Vector2(92.9, 215.0));
    points.push(new Vector2(103.9, 208.0));
    points.push(new Vector2(111.9, 196.0));
    points.push(new Vector2(126.9, 192.0));
    points.push(new Vector2(139.9, 195.0));
    points.push(new Vector2(152.9, 193.0));
    points.push(new Vector2(153.9, 200.0));
    points.push(new Vector2(139.9, 205.0));
    points.push(new Vector2(131.0, 202.0));
    points.push(new Vector2(121.0, 202.0));
    points.push(new Vector2(112.9, 208.0));
    points.push(new Vector2(106.9, 216.3));
    points.push(new Vector2(112.0, 214.0));
    points.push(new Vector2(115.0, 209.0));
    points.push(new Vector2(122.0, 204.0));
    points.push(new Vector2(131.0, 204.0));
    points.push(new Vector2(137.0, 206.0));
    points.push(new Vector2(137.0, 208.0));
    points.push(new Vector2(99.9, 221.0));
    points.push(new Vector2(198.9, 186.0));
    points.push(new Vector2(192.9, 138.0));
    points.push(new Vector2(206.9, 140.0));
    points.push(new Vector2(219.9, 154.0));
    points.push(new Vector2(215.9, 145.0));
    points.push(new Vector2(206.9, 137.0));
    points.push(new Vector2(187.0, 134.0));
    points.push(new Vector2(160.0, 140.0));
    points.push(new Vector2(124.0, 151.0));
    points.push(new Vector2(59.5, 173.0));
    points.push(new Vector2(142.0, 143.0));
    points.push(new Vector2(179.0, 117.0));
    points.push(new Vector2(198.0, 117.0));
    points.push(new Vector2(203.0, 108.0));
    points.push(new Vector2(210.9, 126.0));
    points.push(new Vector2(211.9, 139.0));
    points.push(new Vector2(192.9, 138.0));
    points.push(new Vector2(198.9, 186.0));
    points.push(new Vector2(201.5, 214.0));
    points.push(new Vector2(219.9, 240.0));
    points.push(new Vector2(247.9, 262.0));
    points.push(new Vector2(265.9, 274.0));
    points.push(new Vector2(292.9, 298.0));
    points.push(new Vector2(306.9, 302.0));
    points.push(new Vector2(361.9, 323.0));
    points.push(new Vector2(404.5, 324.0));
    points.push(new Vector2(427.0, 324.0));
    points.push(new Vector2(475.5, 331.0));
    points.push(new Vector2(503.5, 337.0));
    points.push(new Vector2(515.5, 337.0));
    points.push(new Vector2(531.9, 348.0));
    points.push(new Vector2(537.9, 358.0));
    points.push(new Vector2(541.9, 359.0));
    points.push(new Vector2(543.9, 366.0));
    points.push(new Vector2(542.9, 369.0));
    points.push(new Vector2(547.9, 383.0));
    points.push(new Vector2(546.9, 391.0));
    points.push(new Vector2(580.0, 391.0));

    // LES ZONES D'ATTERRISSAGE. LE POINT DE DEPART DU PLATEAU EST L'INDEX DU PREMIER POINT
    availableZones.push(new LandingZone(0, 2));
    availableZones.push(new LandingZone(15, 10));
    availableZones.push(new LandingZone(20, 2));
    availableZones.push(new LandingZone(22, 5));
    availableZones.push(new LandingZone(34, 10));
    availableZones.push(new LandingZone(47, 2));
    availableZones.push(new LandingZone(60, 2));
    availableZones.push(new LandingZone(63, 2));
    availableZones.push(new LandingZone(411, 2));

    // DEFINI LES ZONES D'ATTERISSAGE POSSIBLE POUR LE JEU. LE MAX INDEX CORRESPOND AUX NOMBRES DE "PLATEAUX"
    zoneCombis.push([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    // zoneCombis.push([0, 1, 2, 3]);
    // zoneCombis.push([2, 3, 7, 8]);
    // zoneCombis.push([7, 8, 7, 8]);
    // zoneCombis.push([2, 3, 7, 8]);
    // zoneCombis.push([1, 4, 7, 8]);
    // zoneCombis.push([0, 5, 7, 8]);
    // zoneCombis.push([6, 7, 8, 8]);
    // zoneCombis.push([1, 4, 7, 8]);
  }
}

function LandscapeLine(p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
  this.landable = p1.y == p2.y;
  this.multiplier = 1;
}

function LandingZone(linenum, multi) {
  this.lineNum = linenum;
  this.multiplier = multi;
}
