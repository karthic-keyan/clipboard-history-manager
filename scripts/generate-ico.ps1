Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\build\icon.png"
$dstPath = Join-Path $PSScriptRoot "..\build\icon.ico"

if (-not (Test-Path $srcPath)) {
    Write-Error "Source icon not found at $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$pngStreams = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $sz, $sz, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $sz, $sz)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngStreams += $ms.ToArray()
    $ms.Dispose()
}
$srcImg.Dispose()

# Create .ico file
$fs = [System.IO.File]::Create((Resolve-Path -Path (Split-Path $dstPath) | Join-Path -ChildPath "icon.ico"))
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR
$bw.Write([UInt16]0) # Reserved
$bw.Write([UInt16]1) # Type 1 = Icon
$bw.Write([UInt16]$sizes.Count) # Image count

# Calculate offsets
# Header = 6 bytes, Directory = 16 bytes * count
$offset = 6 + (16 * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz = $sizes[$i]
    $data = $pngStreams[$i]
    $bWidth = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bHeight = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }

    # ICONDIRENTRY
    $bw.Write($bWidth)
    $bw.Write($bHeight)
    $bw.Write([byte]0) # Color count
    $bw.Write([byte]0) # Reserved
    $bw.Write([UInt16]1) # Color planes
    $bw.Write([UInt16]32) # Bits per pixel
    $bw.Write([UInt32]$data.Length) # Image size in bytes
    $bw.Write([UInt32]$offset) # Image offset

    $offset += $data.Length
}

# Write image data
foreach ($data in $pngStreams) {
    $bw.Write($data)
}

$bw.Flush()
$bw.Dispose()
$fs.Dispose()

Write-Host "Successfully generated multi-size .ico icon at $dstPath"
