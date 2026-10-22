const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(() => {
  const jpgPath = 'C:\\\\Users\\\\karthikeyan\\\\.gemini\\\\antigravity-ide\\\\brain\\\\86694b83-2f19-469d-bd74-9c80f66f9ab1\\\\app_icon_1792424233239.jpg';
  const img = nativeImage.createFromPath(jpgPath);
  const resized = img.resize({ width: 256, height: 256, quality: 'best' });
  const png = resized.toPNG();

  const buildDir = path.join(__dirname, '../build');
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  fs.writeFileSync(path.join(buildDir, 'icon.png'), png);
  console.log('ICON_CONVERTED_SUCCESSFULLY:', png.length, 'bytes');
  app.quit();
});
