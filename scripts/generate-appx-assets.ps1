Add-Type -AssemblyName System.Drawing

$rootDir = Split-Path -Parent $PSScriptRoot
$buildDir = Join-Path $rootDir "build\appx"
if (-not (Test-Path $buildDir)) { 
    New-Item -ItemType Directory -Path $buildDir -Force | Out-Null 
}

$srcPath = Join-Path $rootDir "build\icon.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source icon not found at $srcPath"
    exit 1
}

$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($w, $h, $destName) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $ratio = [Math]::Min($w / $src.Width, $h / $src.Height)
    $destW = [int]($src.Width * $ratio)
    $destH = [int]($src.Height * $ratio)
    $destX = [int](($w - $destW) / 2)
    $destY = [int](($h - $destH) / 2)
    
    $g.DrawImage($src, $destX, $destY, $destW, $destH)
    $g.Dispose()
    
    $destPath = Join-Path $buildDir $destName
    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created $destName ($w x $h)"
}

Resize-Image 44 44 "Square44x44Logo.png"
Resize-Image 50 50 "Square50x50Logo.png"
Resize-Image 150 150 "Square150x150Logo.png"
Resize-Image 310 310 "Square310x310Logo.png"
Resize-Image 310 150 "Wide310x150Logo.png"
Resize-Image 50 50 "StoreLogo.png"
Resize-Image 24 24 "BadgeLogo.png"

# Also generate scale variants often recommended for crisp store display
Resize-Image 88 88 "Square44x44Logo.scale-200.png"
Resize-Image 300 300 "Square150x150Logo.scale-200.png"
Resize-Image 620 300 "Wide310x150Logo.scale-200.png"
Resize-Image 100 100 "StoreLogo.scale-200.png"

$src.Dispose()
Write-Host "All Microsoft Store AppX assets generated successfully!"
