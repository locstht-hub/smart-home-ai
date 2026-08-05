$ErrorActionPreference = 'SilentlyContinue'
$drives = @('C:\','D:\') | Where-Object { Test-Path $_ }
$now = Get-Date
$cutoffDownloads = $now.AddDays(-180)
$largeFileThreshold = 500MB
$topLevel = @{}
$candidates = @{}
$extBuckets = @{}
$largeFiles = New-Object System.Collections.Generic.List[object]
$errors = New-Object System.Collections.Generic.List[string]
$processedFiles = 0L
$processedBytes = 0L
$lastLog = Get-Date

function Add-Size([hashtable]$table, [string]$key, [int64]$bytes) {
    if ([string]::IsNullOrWhiteSpace($key)) { return }
    if (-not $table.ContainsKey($key)) { $table[$key] = [int64]0 }
    $table[$key] = [int64]$table[$key] + [int64]$bytes
}

function Get-TopLevelKey([string]$fullName, [string]$root) {
    $relative = $fullName.Substring($root.Length).TrimStart('\')
    if ([string]::IsNullOrWhiteSpace($relative)) { return $root }
    $first = $relative.Split('\')[0]
    return (Join-Path $root $first)
}

function Find-CandidateKey([string]$fullName, [string]$root, [datetime]$lastWrite) {
    $p = $fullName.ToLowerInvariant()
    $normalized = $fullName -replace '/', '\'
    $segments = $normalized.Split('\')

    if ($p.StartsWith(($root + '$recycle.bin').ToLowerInvariant())) { return (Join-Path $root '$Recycle.Bin') + ' | Recycle Bin' }
    if ($p.Contains('\windows\softwaredistribution\download\')) { return (Join-Path $root 'Windows\SoftwareDistribution\Download') + ' | Windows Update downloads' }
    if ($p.Contains('\windows\temp\')) { return (Join-Path $root 'Windows\Temp') + ' | Windows temp' }
    if ($p.Contains('\programdata\package cache\')) { return (Join-Path $root 'ProgramData\Package Cache') + ' | Installer package cache' }
    if ($p.Contains('\appdata\local\crashdumps\')) { return 'AppData\Local\CrashDumps | Crash dumps' }

    for ($i = 0; $i -lt $segments.Length; $i++) {
        $seg = $segments[$i].ToLowerInvariant()
        if ($seg -in @('node_modules','.next','.nuxt','.svelte-kit','.turbo','.parcel-cache','.vite','target','dist','build','out','coverage','.gradle','bin','obj')) {
            return (($segments[0..$i] -join '\') + ' | Dev/build artifact')
        }
        if ($seg -in @('cache','caches','code cache','gpucache','shadercache','dawncache','grshadercache','npm-cache','pip-cache','pipcache','.cache','cachedata')) {
            return (($segments[0..$i] -join '\') + ' | Cache')
        }
        if ($seg -in @('temp','tmp')) {
            return (($segments[0..$i] -join '\') + ' | Temp')
        }
    }

    if ($p.Contains('\downloads\') -and $lastWrite -lt $cutoffDownloads) { return 'Old files in Downloads (>180 days) | Review manually' }
    return $null
}

function Top-Table([hashtable]$table, [int]$topN) {
    $table.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First $topN | ForEach-Object { [pscustomobject]@{ Path = $_.Key; SizeGB = [math]::Round([int64]$_.Value / 1GB, 2) } }
}

"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Started read-only scan: $($drives -join ', ')" | Set-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan.log' -Encoding UTF8

foreach ($drive in $drives) {
    "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Scanning $drive" | Add-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan.log'
    $stack = New-Object System.Collections.Generic.Stack[string]
    $stack.Push($drive)
    while ($stack.Count -gt 0) {
        $dir = $stack.Pop()
        try {
            foreach ($subdir in [System.IO.Directory]::EnumerateDirectories($dir)) { $stack.Push($subdir) }
        } catch {
            if ($errors.Count -lt 100) { $errors.Add("DIR: $dir :: $($_.Exception.Message)") }
        }
        try {
            foreach ($file in [System.IO.Directory]::EnumerateFiles($dir)) {
                try {
                    $info = [System.IO.FileInfo]::new($file)
                    $size = [int64]$info.Length
                    $processedFiles++
                    $processedBytes += $size
                    Add-Size $topLevel (Get-TopLevelKey $info.FullName $drive) $size
                    $candidateKey = Find-CandidateKey $info.FullName $drive $info.LastWriteTime
                    if ($candidateKey) { Add-Size $candidates $candidateKey $size }
                    $ext = $info.Extension.ToLowerInvariant()
                    if ($ext -in @('.tmp','.temp','.log','.dmp','.bak','.old','.msi','.iso','.zip','.7z','.rar','.cab')) {
                        Add-Size $extBuckets ($drive + ' files ' + $(if ($ext) { $ext } else { '[no extension]' })) $size
                    }
                    if ($size -ge $largeFileThreshold) {
                        $largeFiles.Add([pscustomobject]@{ Path = $info.FullName; SizeGB = [math]::Round($size / 1GB, 2); LastWrite = $info.LastWriteTime.ToString('yyyy-MM-dd') })
                    }
                    if (((Get-Date) - $lastLog).TotalSeconds -ge 20) {
                        $lastLog = Get-Date
                        "[$($lastLog.ToString('yyyy-MM-dd HH:mm:ss'))] Processed $processedFiles files, $([math]::Round($processedBytes / 1GB, 2)) GB so far; current: $dir" | Add-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan.log'
                    }
                } catch {
                    if ($errors.Count -lt 100) { $errors.Add("FILE: $file :: $($_.Exception.Message)") }
                }
            }
        } catch {
            if ($errors.Count -lt 100) { $errors.Add("FILES: $dir :: $($_.Exception.Message)") }
        }
    }
}

$diskInfo = Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Where-Object { $_.DeviceID -in @('C:','D:') } | ForEach-Object {
    [pscustomobject]@{ Drive = $_.DeviceID; SizeGB = [math]::Round($_.Size / 1GB, 2); FreeGB = [math]::Round($_.FreeSpace / 1GB, 2); UsedGB = [math]::Round(($_.Size - $_.FreeSpace) / 1GB, 2); FreePct = [math]::Round(($_.FreeSpace / $_.Size) * 100, 1) }
}

$result = [pscustomobject]@{
    GeneratedAt = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    Drives = $diskInfo
    ProcessedFiles = $processedFiles
    ProcessedGB = [math]::Round($processedBytes / 1GB, 2)
    TopLevelFolders = Top-Table $topLevel 40
    JunkCandidates = Top-Table $candidates 80
    ExtensionBuckets = Top-Table $extBuckets 40
    LargeFiles = $largeFiles | Sort-Object SizeGB -Descending | Select-Object -First 80
    AccessErrorsSample = $errors
}

$result | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan-report.json' -Encoding UTF8

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("Disk junk scan summary - $($result.GeneratedAt)")
$lines.Add("")
$lines.Add("Drives:")
foreach ($d in $result.Drives) { $lines.Add(("  {0}: {1} GB used / {2} GB total, {3} GB free ({4}%)" -f $d.Drive, $d.UsedGB, $d.SizeGB, $d.FreeGB, $d.FreePct)) }
$lines.Add("")
$lines.Add("Processed: $($result.ProcessedFiles) files, $($result.ProcessedGB) GB counted")
$lines.Add("")
$lines.Add("Top junk/cache/temp candidates:")
foreach ($x in ($result.JunkCandidates | Select-Object -First 25)) { $lines.Add(("  {0,8} GB  {1}" -f $x.SizeGB, $x.Path)) }
$lines.Add("")
$lines.Add("Largest top-level folders:")
foreach ($x in ($result.TopLevelFolders | Select-Object -First 20)) { $lines.Add(("  {0,8} GB  {1}" -f $x.SizeGB, $x.Path)) }
$lines.Add("")
$lines.Add("Largest individual files:")
foreach ($x in ($result.LargeFiles | Select-Object -First 20)) { $lines.Add(("  {0,8} GB  {1}  ({2})" -f $x.SizeGB, $x.Path, $x.LastWrite)) }
$lines.Add("")
$lines.Add("Extension buckets worth reviewing:")
foreach ($x in ($result.ExtensionBuckets | Select-Object -First 20)) { $lines.Add(("  {0,8} GB  {1}" -f $x.SizeGB, $x.Path)) }
$lines.Add("")
$lines.Add("Access errors sampled: $($result.AccessErrorsSample.Count)")
$lines | Set-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan-summary.txt' -Encoding UTF8

"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Done. Report: C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan-report.json; Summary: C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan-summary.txt" | Add-Content -LiteralPath 'C:\Users\ADMIN\.gemini\antigravity\scratch\smart-home-app\disk-junk-scan.log'
