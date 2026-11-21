// scene: "Harbour Dawn" — a flat-vector morning harbour, drawn twice by the
// engine: the left panel as-is, the right panel with every difference applied.
// All art is procedural canvas drawing — no image files, no network.
export const CONFIG = {
  timeLimitSec: 180,
  hints: 3,
  wrongPenaltySec: 5,
  comboScoring: false,
  timeBonusPerFindSec: 0,
  magnifier: false,
};

function circle(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
  ctx.arc(x + 20 * scale, y - 6 * scale, 14 * scale, 0, Math.PI * 2);
  ctx.arc(x + 38 * scale, y, 16 * scale, 0, Math.PI * 2);
  ctx.fill();
}

function drawGull(ctx, x, y) {
  ctx.strokeStyle = '#33415e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x - 8, y, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 8, y, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

export const SCENE = {
  name: 'Harbour Dawn',
  title: 'Harbour Dawn — Spot the Difference',
  subtitle: 'A quiet morning at the old harbour. Ten things changed between the two pictures.',
  tagline: 'Two pictures of the same harbour morning — but ten things are different. Find them all before the clock runs out!',
  // Differences the 'play' screenshot pre-finds: visible objects on both panels.
  coverFinds: ['sail', 'window', 'buoy'],
  differences: [
    { id: 'beam', x: 452, y: 138, r: 26, name: 'the lighthouse beam', hintArea: 'lighthouse lamp' },
    { id: 'sail', x: 150, y: 252, r: 28, name: 'the boat sail colour', hintArea: 'little boat' },
    { id: 'gull', x: 330, y: 88, r: 20, name: 'the missing seagull', hintArea: 'sky' },
    { id: 'flag', x: 598, y: 282, r: 18, name: 'the pier flag', hintArea: 'far end of the pier' },
    { id: 'hat', x: 430, y: 252, r: 16, name: "the fisherman's hat", hintArea: 'fisherman' },
    { id: 'crate', x: 398, y: 332, r: 18, name: 'the extra crate', hintArea: 'crates on the dock' },
    { id: 'window', x: 520, y: 188, r: 14, name: 'the lighthouse window', hintArea: 'lighthouse tower' },
    { id: 'buoy', x: 250, y: 336, r: 16, name: 'the buoy colour', hintArea: 'water' },
    { id: 'rope', x: 472, y: 316, r: 16, name: 'the rope coil', hintArea: 'pier planks' },
    { id: 'fish', x: 300, y: 272, r: 18, name: 'the jumping fish', hintArea: 'water near the boat' },
  ],

  draw(ctx, applied) {
    // Sky.
    const sky = ctx.createLinearGradient(0, 0, 0, 260);
    sky.addColorStop(0, '#ffe3a3');
    sky.addColorStop(0.6, '#ffd166');
    sky.addColorStop(1, '#ffb703');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 260);

    // Sun with rays.
    ctx.fillStyle = '#fff3b0';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      line(ctx, 90 + Math.cos(angle) * 40, 70 + Math.sin(angle) * 40,
        90 + Math.cos(angle) * 54, 70 + Math.sin(angle) * 54, '#fff3b0', 4);
    }
    circle(ctx, 90, 70, 32, '#ffea70');
    circle(ctx, 90, 70, 26, '#ffd60a');

    // Clouds and gulls.
    drawCloud(ctx, 210, 60, 1);
    drawCloud(ctx, 430, 45, 0.8);
    drawCloud(ctx, 560, 90, 0.7);
    drawGull(ctx, 300, 88);
    drawGull(ctx, 360, 70);
    if (!applied.has('gull')) drawGull(ctx, 330, 100);

    // Sea.
    const sea = ctx.createLinearGradient(0, 250, 0, 420);
    sea.addColorStop(0, '#4cc9f0');
    sea.addColorStop(1, '#1d6fb8');
    ctx.fillStyle = sea;
    ctx.fillRect(0, 250, 640, 170);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const y = 272 + i * 26;
      ctx.beginPath();
      for (let x = 20; x <= 620; x += 20) {
        ctx.lineTo(x, y + Math.sin((x + i * 40) / 30) * 3);
      }
      ctx.stroke();
    }

    // Jumping fish (left only).
    if (!applied.has('fish')) {
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath();
      ctx.ellipse(300, 272, 16, 7, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(314, 266);
      ctx.lineTo(324, 260);
      ctx.lineTo(322, 272);
      ctx.closePath();
      ctx.fill();
      circle(ctx, 290, 270, 2, '#212529');
    }

    // Buoy: orange on the left, yellow on the right.
    ctx.fillStyle = applied.has('buoy') ? '#ffd60a' : '#fb8500';
    ctx.beginPath();
    ctx.moveTo(250, 318);
    ctx.lineTo(264, 336);
    ctx.lineTo(236, 336);
    ctx.closePath();
    ctx.fill();
    rect(ctx, 246, 312, 8, 8, '#8d0801');

    // Little sailboat.
    ctx.fillStyle = '#7f4f24';
    ctx.beginPath();
    ctx.moveTo(120, 300);
    ctx.lineTo(185, 300);
    ctx.lineTo(172, 318);
    ctx.lineTo(132, 318);
    ctx.closePath();
    ctx.fill();
    line(ctx, 152, 300, 152, 228, '#5c3d2e', 4);
    ctx.fillStyle = applied.has('sail') ? '#2ec4b6' : '#e63946';
    ctx.beginPath();
    ctx.moveTo(152, 232);
    ctx.lineTo(152, 296);
    ctx.lineTo(188, 296);
    ctx.closePath();
    ctx.fill();

    // Wooden pier.
    rect(ctx, 380, 300, 260, 44, '#9c6644');
    rect(ctx, 380, 300, 260, 8, '#b08968');
    ctx.strokeStyle = '#6f4e37';
    ctx.lineWidth = 2;
    for (let x = 400; x < 640; x += 26) {
      ctx.beginPath();
      ctx.moveTo(x, 308);
      ctx.lineTo(x, 344);
      ctx.stroke();
    }
    rect(ctx, 384, 344, 10, 76, '#7f4f24');
    rect(ctx, 620, 344, 10, 76, '#7f4f24');

    // Crates on the dock (one extra on the right).
    rect(ctx, 408, 300, 26, 26, '#c08552');
    rect(ctx, 408, 300, 26, 6, '#dda15e');
    line(ctx, 408, 313, 434, 313, '#7f4f24', 2);
    if (applied.has('crate')) {
      rect(ctx, 388, 308, 20, 18, '#c08552');
      rect(ctx, 388, 308, 20, 5, '#dda15e');
    }

    // Rope coil (left only).
    if (!applied.has('rope')) {
      ctx.strokeStyle = '#e9c46a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(472, 316, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(472, 316, 6, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fisherman.
    rect(ctx, 424, 268, 12, 34, '#2a9d8f');
    circle(ctx, 430, 258, 9, '#f4a261');
    if (!applied.has('hat')) {
      ctx.fillStyle = '#e76f51';
      ctx.beginPath();
      ctx.arc(430, 254, 10, Math.PI, 0);
      ctx.fill();
      rect(ctx, 418, 252, 24, 3, '#e76f51');
    }
    line(ctx, 438, 280, 470, 300, '#5c3d2e', 3);
    line(ctx, 470, 300, 470, 318, '#212529', 1.5);

    // Flag pole at the far end of the pier (flag left only).
    line(ctx, 606, 300, 606, 262, '#5c3d2e', 3);
    if (!applied.has('flag')) {
      ctx.fillStyle = '#e63946';
      ctx.beginPath();
      ctx.moveTo(606, 262);
      ctx.lineTo(630, 270);
      ctx.lineTo(606, 278);
      ctx.closePath();
      ctx.fill();
    }

    // Lighthouse.
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.moveTo(500, 252);
    ctx.lineTo(508, 130);
    ctx.lineTo(532, 130);
    ctx.lineTo(540, 252);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(503, 210);
    ctx.lineTo(537, 210);
    ctx.lineTo(539, 190);
    ctx.lineTo(501, 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(506, 160);
    ctx.lineTo(534, 160);
    ctx.lineTo(536, 140);
    ctx.lineTo(504, 140);
    ctx.closePath();
    ctx.fill();
    // Window: lit on the left, dark on the right.
    ctx.fillStyle = applied.has('window') ? '#495057' : '#ffd60a';
    ctx.beginPath();
    ctx.arc(520, 188, 7, 0, Math.PI * 2);
    ctx.fill();
    // Lamp room and roof.
    rect(ctx, 504, 112, 32, 20, '#343a40');
    circle(ctx, 520, 122, 7, '#ffe66d');
    ctx.fillStyle = '#8d0801';
    ctx.beginPath();
    ctx.moveTo(500, 112);
    ctx.lineTo(540, 112);
    ctx.lineTo(520, 96);
    ctx.closePath();
    ctx.fill();
    // Beam (left only).
    if (!applied.has('beam')) {
      const beam = ctx.createLinearGradient(504, 122, 380, 122);
      beam.addColorStop(0, 'rgba(255,230,109,0.85)');
      beam.addColorStop(1, 'rgba(255,230,109,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(504, 116);
      ctx.lineTo(380, 96);
      ctx.lineTo(380, 148);
      ctx.lineTo(504, 128);
      ctx.closePath();
      ctx.fill();
    }
  },
};
