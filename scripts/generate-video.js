import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const WIDTH = 640;
const HEIGHT = 360;
const FRAMES = 120;
const FPS = 30;

const TEMP_DIR = path.join(process.cwd(), 'temp_frames');
const OUTPUT_DIR = path.join(process.cwd(), 'public/assets');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hero-bg.mp4');

// Ensure directories exist
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Bresenham's line algorithm for raw pixel buffers
function drawLine(buf, x0, y0, x1, y1, r, g, b) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 >= 0 && x0 < WIDTH && y0 >= 0 && y0 < HEIGHT) {
      const idx = (y0 * WIDTH + x0) * 3;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
    }

    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// Draw a 3D Gear onto the raw pixel buffer
function drawGear(buf, centerX, centerY, scaleVal, teeth, innerR, outerR, depth, angleY, angleX, r, g, b) {
  const vertices = [];
  const edges = [];
  
  for (let f = 0; f < 2; f++) {
    const z = (f === 0 ? -depth / 2 : depth / 2) * scaleVal;
    const offset = f * teeth * 4;
    
    for (let i = 0; i < teeth; i++) {
      const angle = (i / teeth) * Math.PI * 2;
      const nextAngle = ((i + 0.5) / teeth) * Math.PI * 2;
      
      const x1 = Math.cos(angle) * innerR * scaleVal;
      const y1 = Math.sin(angle) * innerR * scaleVal;
      vertices.push({ x: x1, y: y1, z });
      
      const x2 = Math.cos(angle) * outerR * scaleVal;
      const y2 = Math.sin(angle) * outerR * scaleVal;
      vertices.push({ x: x2, y: y2, z });
      
      const x3 = Math.cos(nextAngle) * outerR * scaleVal;
      const y3 = Math.sin(nextAngle) * outerR * scaleVal;
      vertices.push({ x: x3, y: y3, z });
      
      const x4 = Math.cos(nextAngle) * innerR * scaleVal;
      const y4 = Math.sin(nextAngle) * innerR * scaleVal;
      vertices.push({ x: x4, y: y4, z });
      
      const base = offset + i * 4;
      edges.push([base, base + 1]);
      edges.push([base + 1, base + 2]);
      edges.push([base + 2, base + 3]);
      edges.push([base + 3, (base + 4) % (teeth * 4) + offset]);
    }
  }
  
  for (let i = 0; i < teeth * 4; i++) {
    edges.push([i, i + teeth * 4]);
  }

  const projected = vertices.map(v => {
    let tx = v.x + centerX;
    let ty = v.y + centerY;
    let tz = v.z;
    
    // Rotate Y
    let x1 = tx * Math.cos(angleY) - tz * Math.sin(angleY);
    let z1 = tx * Math.sin(angleY) + tz * Math.cos(angleY);
    
    // Rotate X
    let y2 = ty * Math.cos(angleX) - z1 * Math.sin(angleX);
    let z2 = ty * Math.sin(angleX) + z1 * Math.cos(angleX);
    
    const fov = 400;
    const projScale = fov / (fov + z2);
    const projX = x1 * projScale + WIDTH / 2;
    const projY = y2 * projScale + HEIGHT / 2;
    
    return { x: projX, y: projY };
  });
  
  edges.forEach(edge => {
    const p1 = projected[edge[0]];
    const p2 = projected[edge[1]];
    drawLine(buf, p1.x, p1.y, p2.x, p2.y, r, g, b);
  });
}

async function main() {
  console.log('🎬 Rendering video frames...');
  
  const teeth1 = 12;
  const innerR1 = 60;
  const outerR1 = 80;
  const depth = 30;

  const teeth2 = 8;
  const innerR2 = 40;
  const outerR2 = 54;

  let angleX = 0.45;
  let rot1 = 0;
  let rot2 = 0.35;
  let speed = 0.08;

  for (let f = 0; f < FRAMES; f++) {
    const buffer = new Uint8Array(WIDTH * HEIGHT * 3);

    // 1. Draw solid dark background (#030406)
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
      buffer[i * 3] = 3;     // R
      buffer[i * 3 + 1] = 4; // G
      buffer[i * 3 + 2] = 6; // B
    }

    // 2. Draw mechanical technical blueprint grid lines
    const gridSpacing = 30;
    for (let x = 0; x < WIDTH; x += gridSpacing) {
      drawLine(buffer, x, 0, x, HEIGHT - 1, 8, 12, 16);
    }
    for (let y = 0; y < HEIGHT; y += gridSpacing) {
      drawLine(buffer, 0, y, WIDTH - 1, y, 8, 12, 16);
    }

    // 3. Draw meshing 3D gears
    // Gear 1 (Cyan/Teal)
    drawGear(buffer, -110, 20, 1.25, teeth1, innerR1, outerR1, depth, rot1, angleX, 0, 242, 255);
    // Gear 2 (Orange/Red)
    drawGear(buffer, 100, -30, 0.85, teeth2, innerR2, outerR2, depth, rot2, angleX, 255, 85, 0);

    // 4. Save frame as raw P6 PPM
    const header = Buffer.from(`P6\n${WIDTH} ${HEIGHT}\n255\n`);
    const fileData = Buffer.concat([header, Buffer.from(buffer)]);
    const filename = path.join(TEMP_DIR, `frame_${String(f).padStart(4, '0')}.ppm`);
    fs.writeFileSync(filename, fileData);

    // Update rotation & speed decay
    if (f < 90) { // Rotate for 3 seconds (90 frames)
      rot1 += speed;
      rot2 -= speed * (teeth1 / teeth2);
      speed *= 0.965; // slow down smoothly
    }
    // From frame 90 to 120, gears are frozen in place!
  }

  console.log('🔄 Compiling MP4 video via ffmpeg...');
  try {
    // Compile using standard H.264 yuv420p format for maximum web browser compatibility
    execSync(
      `ffmpeg -y -framerate ${FPS} -i "${path.join(TEMP_DIR, 'frame_%04d.ppm')}" -c:v libx264 -pix_fmt yuv420p "${OUTPUT_FILE}"`,
      { stdio: 'inherit' }
    );
    console.log(`🎉 Video successfully created at: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error compiling video with ffmpeg:', err.message);
  } finally {
    // Clean up temp PPM files
    console.log('🧹 Cleaning up temporary frame files...');
    const files = fs.readdirSync(TEMP_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(TEMP_DIR, file));
    }
    fs.rmdirSync(TEMP_DIR);
  }
}

main();
