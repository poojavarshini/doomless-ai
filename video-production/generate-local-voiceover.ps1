$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$productionDir = $PSScriptRoot
$outputDir = Join-Path $productionDir "work\voice"
$config = Get-Content -Raw (Join-Path $productionDir "voiceover.json") | ConvertFrom-Json

New-Item -ItemType Directory -Force $outputDir | Out-Null

$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
$femaleVoice = $synthesizer.GetInstalledVoices() |
  Where-Object { $_.VoiceInfo.Gender -eq "Female" } |
  Select-Object -First 1

if ($null -eq $femaleVoice) {
  throw "No local female speech voice is installed."
}

$selectedVoice = $synthesizer.Voice
try {
  $synthesizer.SelectVoice($femaleVoice.VoiceInfo.Name)
  $selectedVoice = $synthesizer.Voice
}
catch {
  Write-Warning "The installed female voice is disabled. Using the default local voice for this first draft."
}
$synthesizer.Rate = 1
$synthesizer.Volume = 100

$manifest = @()

foreach ($chapter in $config.chapters) {
  $audioPath = Join-Path $outputDir "$($chapter.id).wav"
  $transcriptPath = Join-Path $outputDir "$($chapter.id).txt"
  $synthesizer.SetOutputToWaveFile($audioPath)
  $synthesizer.Speak($chapter.script)
  $synthesizer.SetOutputToNull()
  Set-Content -Path $transcriptPath -Value $chapter.script -Encoding utf8

  $manifest += [PSCustomObject]@{
    id = $chapter.id
    model = "Windows System.Speech fallback"
    voice = $selectedVoice.Name
    outputPath = $audioPath
    transcriptPath = $transcriptPath
  }

  Write-Host "Generated $($chapter.id)"
}

$manifest | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $outputDir "manifest.json") -Encoding utf8
$synthesizer.Dispose()

Write-Host "Local voiceover complete: $($manifest.Count) chapters using $($selectedVoice.Name)"
