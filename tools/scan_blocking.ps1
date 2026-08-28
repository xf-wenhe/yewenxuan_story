# Batch AI-pattern blocking scan: chapters 61..1000
# node exits 1 = blocking found, 0 = clean, 2 = read error.
$ErrorActionPreference = 'Continue'
$root = 'D:\work\yewenxuan_story'
$script = Join-Path $root '.claude\skills\story-deslop\scripts\check-ai-patterns.js'
$outDir = Join-Path $root 'tools\scan_output'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }
$jsonFile = Join-Path $outDir '_cur.json'
$errFile = Join-Path $outDir '_cur.err'
$summaryFile = Join-Path $outDir 'blocking_findings.jsonl'
$statsFile = Join-Path $outDir 'scan_stats.txt'

$volumes = @(
  @{ n='1'; lo=1;   hi=100  },
  @{ n='2'; lo=101; hi=250  },
  @{ n='3'; lo=251; hi=400  },
  @{ n='4'; lo=401; hi=550  },
  @{ n='5'; lo=551; hi=750  },
  @{ n='6'; lo=751; hi=918  },
  @{ n='7'; lo=919; hi=1000 }
)
$scanLo = 61

@'' | Out-File -FilePath $summaryFile -Encoding utf8
@'' | Out-File -FilePath $statsFile -Encoding utf8

$total = 0; $blocking = 0; $missing = 0; $errors = 0
$sw = [System.Diagnostics.Stopwatch]::StartNew()

foreach ($v in $volumes) {
  $lo = [Math]::Max($v.lo, $scanLo)
  $hi = $v.hi
  if ($lo -gt $hi) { continue }
  for ($ch = $lo; $ch -le $hi; $ch++) {
    $total++
    $fpath = Join-Path $root (Join-Path "chapters\volume-$($v.n)" "chapter-$ch-polished.md")
    if (-not (Test-Path $fpath)) {
      $missing++
      "MISSING ch.$ch" | Out-File -FilePath $statsFile -Encoding utf8 -Append
      continue
    }
    $proc = Start-Process -FilePath 'node' -ArgumentList @($script, $fpath, '--json', '--fail-on=blocking') `
      -NoNewWindow -Wait -PassThru -RedirectStandardOutput $jsonFile -RedirectStandardError $errFile
    $ec = $proc.ExitCode
    if ($ec -eq 1) {
      $blocking++
      try {
        $j = Get-Content $jsonFile -Raw -Encoding utf8
        if ($j -and $j.Trim().Length -gt 0) {
          $j | Out-File -FilePath $summaryFile -Encoding utf8 -Append
        }
      } catch { }
      "$ch" | Out-File -FilePath $statsFile -Encoding utf8 -Append
    } elseif ($ec -eq 2) {
      $errors++
      "ERR2 ch.$ch" | Out-File -FilePath $statsFile -Encoding utf8 -Append
    }
    # ec==0 -> clean, nothing to do
    if ($total % 50 -eq 0) {
      $t = $sw.Elapsed.TotalSeconds
      Write-Host "  scanned $total / ~940  ($blocking blocking, $missing missing, $errors errors)  ${t}s"
    }
  }
}
$sw.Stop()
$elapsed = $sw.Elapsed.TotalSeconds
"--- DONE in ${elapsed}s ---" | Out-File -FilePath $statsFile -Encoding utf8 -Append
"total=$total blocking=$blocking missing=$missing errors=$errors" | Out-File -FilePath $statsFile -Encoding utf8 -Append
Write-Host "DONE: total=$total blocking=$blocking missing=$missing errors=$errors elapsed=${elapsed}s"
