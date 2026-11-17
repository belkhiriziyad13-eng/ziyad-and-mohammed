import { LOGICAL_HEIGHT, LOGICAL_WIDTH, STREET_Z_MAX, STREET_Z_MIN } from './constants';
import type { ChapterId } from './types';

/**
 * Draws lush 3-chapter Metal-Slug-inspired neighborhood parallax environments:
 * Chapter 1: Sunny neighborhood streets, grocery shops, parked cars, graffiti, stray cats
 * Chapter 2: Schoolyard gates, dusty football pitch, concrete bleachers, afternoon sunset
 * Chapter 3: Mosque square, stone arches, warm glowing lanterns, evening twilight minaret
 */
export function drawChapterBackground(
  ctx: CanvasRenderingContext2D,
  chapter: ChapterId,
  cameraX: number,
  timeSec: number
): void {
  if (chapter === 1) {
    drawChapter1Street(ctx, cameraX, timeSec);
  } else if (chapter === 2) {
    drawChapter2Schoolyard(ctx, cameraX, timeSec);
  } else {
    drawChapter3MosqueSquare(ctx, cameraX, timeSec);
  }
}

function drawChapter1Street(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  timeSec: number
): void {
  // Sunny neighborhood sky
  const sky = ctx.createLinearGradient(0, 0, 0, STREET_Z_MIN);
  sky.addColorStop(0, '#38bdf8');
  sky.addColorStop(0.65, '#bae6fd');
  sky.addColorStop(1, '#fef3c7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, STREET_Z_MIN);

  // Distant warm clouds (slow parallax)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 240 - cameraX * 0.12) % 1400 + 1400) % 1400 - 160;
    const cy = 38 + (i % 3) * 26;
    ctx.fillRect(Math.round(cx), cy, 74, 16);
    ctx.fillRect(Math.round(cx + 14), cy - 10, 44, 12);
  }

  // Far neighborhood apartment silhouettes
  const farParallax = cameraX * 0.25;
  for (let i = -1; i < 8; i++) {
    const bx = Math.round(i * 190 - (farParallax % 190));
    const bh = 120 + ((i * 37) % 55);
    const by = 220 - bh;
    ctx.fillStyle = i % 2 === 0 ? '#cbd5e1' : '#e2e8f0';
    ctx.fillRect(bx, by, 178, bh + 15);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(bx, by, 178, 8);
    // Rooftop water tank / satellite dishes
    ctx.fillStyle = '#64748b';
    ctx.fillRect(bx + 24, by - 18, 22, 18);
  }

  // Midground buildings: Al-Baraka Grocery, graffiti walls, doors, windows (0.6x parallax)
  const midParallax = cameraX * 0.65;
  const tileW = 480;
  const startTile = Math.floor(midParallax / tileW) - 1;
  const endTile = startTile + 4;

  for (let t = startTile; t <= endTile; t++) {
    const sx = Math.round(t * tileW - midParallax);

    // Warm stucco facade
    ctx.fillStyle = t % 2 === 0 ? '#f5e6c8' : '#ebd6b3';
    ctx.fillRect(sx, 118, 474, STREET_Z_MIN - 118);

    // Building divider & trim
    ctx.fillStyle = '#c2a882';
    ctx.fillRect(sx + 474, 110, 6, STREET_Z_MIN - 110);

    // Corner Grocery Shop ("AL-BARAKA") on even blocks
    if (Math.abs(t) % 2 === 0) {
      // Striped shop awning
      for (let s = 0; s < 10; s++) {
        ctx.fillStyle = s % 2 === 0 ? '#dc2626' : '#fef2f2';
        ctx.fillRect(sx + 28 + s * 18, 198, 18, 24);
      }
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(sx + 28, 180, 180, 18);
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('AL-BARAKA MARKET', sx + 48, 193);

      // Shop window & crates display
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 38, 222, 160, 74);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(sx + 44, 228, 72, 48);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(sx + 124, 250, 62, 46);

      // Graffiti brick wall on right half
      ctx.fillStyle = '#d6c09f';
      ctx.fillRect(sx + 240, 165, 210, 132);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(sx + 270, 218, 56, 16);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(sx + 292, 206, 44, 14);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx + 332, 224, 34, 12);

      // Stray neighborhood cat sitting on wall reacting/blinking!
      const catX = sx + 260;
      const catY = 165;
      const tailWag = Math.round(Math.sin(timeSec * 4 + t) * 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(catX, catY - 14, 14, 14); // body
      ctx.fillRect(catX + 10, catY - 22, 10, 10); // head
      ctx.fillRect(catX + 10, catY - 25, 3, 3); // ear
      ctx.fillRect(catX + 17, catY - 25, 3, 3); // ear
      ctx.fillRect(catX - 6, catY - 12 + tailWag, 6, 3); // tail
    } else {
      // Residential shuttered windows + laundry line + parked neighborhood car
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(sx + 50, 145, 52, 54);
      ctx.fillRect(sx + 150, 145, 52, 54);
      // Laundry line
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + 210, 150);
      ctx.lineTo(sx + 440, 156);
      ctx.stroke();
      const sway = Math.round(Math.sin(timeSec * 3) * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(sx + 240 + sway, 152, 24, 26);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sx + 290 - sway, 153, 22, 24);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(sx + 340 + sway, 154, 24, 26);

      // Parked vintage hatchback along sidewalk curb
      const carX = sx + 230;
      const carY = STREET_Z_MIN - 58;
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(carX, carY + 18, 136, 36);
      ctx.fillRect(carX + 24, carY, 76, 20);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(carX + 30, carY + 4, 28, 14);
      ctx.fillRect(carX + 64, carY + 4, 30, 14);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(carX + 18, carY + 44, 24, 18);
      ctx.fillRect(carX + 94, carY + 44, 24, 18);
    }
  }

  // Sidewalk & Asphalt Street surface (1.0x camera scroll)
  drawRoadSurface(ctx, cameraX, '#cbd5e1', '#475569', '#334155', '#facc15');
}

function drawChapter2Schoolyard(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  timeSec: number
): void {
  // Afternoon Sunset Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, STREET_Z_MIN);
  sky.addColorStop(0, '#4338ca');
  sky.addColorStop(0.55, '#f97316');
  sky.addColorStop(1, '#fde047');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, STREET_Z_MIN);

  // Warm setting sun disc
  ctx.fillStyle = 'rgba(254, 240, 138, 0.78)';
  ctx.beginPath();
  ctx.arc(760 - (cameraX * 0.04) % 200, 108, 44, 0, Math.PI * 2);
  ctx.fill();

  // School buildings & wrought iron fence + bleachers (0.6x parallax)
  const midParallax = cameraX * 0.6;
  const tileW = 500;
  const startTile = Math.floor(midParallax / tileW) - 1;
  const endTile = startTile + 4;

  for (let t = startTile; t <= endTile; t++) {
    const sx = Math.round(t * tileW - midParallax);

    if (Math.abs(t) % 2 === 0) {
      // School facade & wrought iron gate
      ctx.fillStyle = '#d6b48c';
      ctx.fillRect(sx + 20, 118, 220, STREET_Z_MIN - 118);
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(sx + 20, 112, 220, 14);
      // School clock & windows
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(sx + 114, 136, 30, 30);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx + 48, 178, 42, 48);
      ctx.fillRect(sx + 168, 178, 42, 48);

      // Iron fence bars
      ctx.fillStyle = '#1e293b';
      for (let b = 0; b < 14; b++) {
        ctx.fillRect(sx + 250 + b * 18, 190, 4, STREET_Z_MIN - 190);
      }
      ctx.fillRect(sx + 244, 210, 250, 5);
    } else {
      // Concrete bleachers & football goalpost
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(sx + 20, 198, 230, 118);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(sx + 20, 224, 230, 8);
      ctx.fillRect(sx + 20, 254, 230, 8);
      ctx.fillRect(sx + 20, 284, 230, 8);

      // Kids watching from bleachers
      for (let k = 0; k < 4; k++) {
        const bob = Math.round(Math.sin(timeSec * 5 + k * 2) * 2);
        ctx.fillStyle = k % 2 === 0 ? '#ef4444' : '#3b82f6';
        ctx.fillRect(sx + 50 + k * 48, 200 + bob, 14, 18);
        ctx.fillStyle = '#d8a47f';
        ctx.fillRect(sx + 52 + k * 48, 188 + bob, 10, 10);
      }

      // Football goalposts
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sx + 300, 182, 8, STREET_Z_MIN - 182);
      ctx.fillRect(sx + 430, 182, 8, STREET_Z_MIN - 182);
      ctx.fillRect(sx + 300, 182, 138, 8);
    }
  }

  // Dusty pitch & chalk line floor
  drawRoadSurface(ctx, cameraX, '#ca8a04', '#a16207', '#854d0e', '#fef9c3');
}

function drawChapter3MosqueSquare(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  timeSec: number
): void {
  // Evening / Twilight Sky
  const sky = ctx.createLinearGradient(0, 0, 0, STREET_Z_MIN);
  sky.addColorStop(0, '#0f172a');
  sky.addColorStop(0.55, '#312e81');
  sky.addColorStop(1, '#7c2d12');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_WIDTH, STREET_Z_MIN);

  // Twinkling stars
  ctx.fillStyle = '#fef08a';
  for (let i = 0; i < 18; i++) {
    const sx = (i * 83 + 25) % LOGICAL_WIDTH;
    const sy = 18 + ((i * 41) % 105);
    const alpha = 0.4 + 0.5 * Math.sin(timeSec * 3 + i);
    ctx.globalAlpha = alpha;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Grand Mosque Dome & Minaret silhouette in far background
  const farX = 480 - (cameraX * 0.14) % 400;
  ctx.fillStyle = '#1e1b4b';
  // Minaret
  ctx.fillRect(farX + 160, 44, 38, 220);
  ctx.fillRect(farX + 152, 88, 54, 10);
  ctx.fillRect(farX + 166, 26, 26, 20);
  // Crescent finial
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(farX + 177, 14, 4, 14);
  // Dome
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(farX + 70, 170, 62, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(farX - 20, 170, 220, 120);

  // Traditional stone arches, warm glowing lanterns, tiled trim (0.6x parallax)
  const midParallax = cameraX * 0.6;
  const tileW = 460;
  const startTile = Math.floor(midParallax / tileW) - 1;
  const endTile = startTile + 4;

  for (let t = startTile; t <= endTile; t++) {
    const sx = Math.round(t * tileW - midParallax);

    // Traditional plaster & sandstone wall
    ctx.fillStyle = '#785a40';
    ctx.fillRect(sx, 128, 454, STREET_Z_MIN - 128);
    // Decorative teal & gold tile frieze
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(sx, 142, 454, 14);
    ctx.fillStyle = '#fbbf24';
    for (let z = 0; z < 22; z++) {
      ctx.fillRect(sx + z * 20 + 6, 146, 6, 6);
    }

    // Two horseshoe/stone arches per block
    for (let a = 0; a < 2; a++) {
      const ax = sx + 48 + a * 210;
      ctx.fillStyle = '#291d16';
      ctx.fillRect(ax, 190, 118, STREET_Z_MIN - 190);
      ctx.beginPath();
      ctx.arc(ax + 59, 198, 59, Math.PI, 0);
      ctx.fill();

      // Hanging warm glowing brass lantern
      const sway = Math.round(Math.sin(timeSec * 2.5 + a + t) * 2);
      const glow = 0.22 + 0.08 * Math.sin(timeSec * 6 + a);
      ctx.fillStyle = `rgba(251, 191, 36, ${glow})`;
      ctx.beginPath();
      ctx.arc(ax + 59 + sway, 208, 34, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(ax + 54 + sway, 196, 10, 16);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(ax + 52 + sway, 192, 14, 4);
      ctx.fillRect(ax + 52 + sway, 212, 14, 4);
    }
  }

  // Cobblestone plaza surface
  drawRoadSurface(ctx, cameraX, '#a8a29e', '#57534e', '#44403c', '#d6d3d1');
}

function drawRoadSurface(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  curbColor: string,
  roadTopColor: string,
  roadBottomColor: string,
  stripeColor: string
): void {
  // Sidewalk strip
  ctx.fillStyle = curbColor;
  ctx.fillRect(0, STREET_Z_MIN - 26, LOGICAL_WIDTH, 26);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(0, STREET_Z_MIN - 4, LOGICAL_WIDTH, 4);

  // Sidewalk paving seams
  const seamOffset = cameraX % 64;
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = -seamOffset; x < LOGICAL_WIDTH; x += 64) {
    ctx.fillRect(Math.round(x), STREET_Z_MIN - 26, 2, 22);
  }

  // Walkable street roadbed
  const roadGrad = ctx.createLinearGradient(0, STREET_Z_MIN, 0, LOGICAL_HEIGHT);
  roadGrad.addColorStop(0, roadTopColor);
  roadGrad.addColorStop(1, roadBottomColor);
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, STREET_Z_MIN, LOGICAL_WIDTH, LOGICAL_HEIGHT - STREET_Z_MIN);

  // Dashed lane lines scrolling 1:1
  const dashOffset = cameraX % 120;
  ctx.fillStyle = stripeColor;
  ctx.globalAlpha = 0.5;
  for (let x = -dashOffset; x < LOGICAL_WIDTH; x += 120) {
    ctx.fillRect(Math.round(x), Math.round((STREET_Z_MIN + STREET_Z_MAX) / 2), 62, 5);
  }
  ctx.globalAlpha = 1;

  // Bottom foreground curb framing
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, LOGICAL_HEIGHT - 16, LOGICAL_WIDTH, 16);
}
