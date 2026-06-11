param(
    [string]$ShortPath = "C:\shb",
    [string]$Abi = "arm64-v8a",
    [string]$OutputName = "app-release-arm64-v8a.apk"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$androidDir = Join-Path $ShortPath "android"
$sourceApk = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
$outputDir = Join-Path $repoRoot "android\app\build\outputs\apk\release"
$outputApk = Join-Path $outputDir $OutputName

function Remove-BuildCopy {
    if (-not (Test-Path -LiteralPath $ShortPath)) {
        return
    }

    $resolved = (Resolve-Path -LiteralPath $ShortPath).Path
    $packageJson = Join-Path $resolved "package.json"
    $gradlew = Join-Path $resolved "android\gradlew.bat"

    if ($resolved -ne $ShortPath -or -not (Test-Path -LiteralPath $packageJson) -or -not (Test-Path -LiteralPath $gradlew)) {
        throw "Refusing to remove unexpected build directory: $resolved"
    }

    Remove-Item -LiteralPath $resolved -Recurse -Force
}

Remove-BuildCopy
New-Item -ItemType Directory -Path $ShortPath | Out-Null

$excludeDirs = @(".git", ".expo", ".codex-temp", "android\.gradle", "android\app\build", "android\app\.cxx")
$excludeFiles = @("*.apk", "*.aab")

robocopy $repoRoot $ShortPath /E /XD $excludeDirs /XF $excludeFiles /R:1 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

try {
    Push-Location $androidDir
    $env:NODE_ENV = "production"
    .\gradlew.bat assembleRelease "-PreactNativeArchitectures=$Abi" --no-daemon --console=plain --stacktrace
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $sourceApk)) {
    throw "Release APK was not created: $sourceApk"
}

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Copy-Item -LiteralPath $sourceApk -Destination $outputApk -Force

$apk = Get-Item -LiteralPath $outputApk
Write-Host "Built APK:"
Write-Host $apk.FullName
Write-Host ("Size: {0} MB" -f [math]::Round($apk.Length / 1MB, 2))
Write-Host ("ABI: {0}" -f $Abi)

Remove-BuildCopy
