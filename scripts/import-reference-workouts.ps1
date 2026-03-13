Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Text {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return ""
  }

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormKC)
  $normalized = $normalized.Replace([char]0x2013, "-")
  $normalized = $normalized.Replace([char]0x2014, "-")
  $normalized = $normalized.Replace([char]0x2018, "'")
  $normalized = $normalized.Replace([char]0x2019, "'")
  $normalized = $normalized.Replace([char]0x201C, '"')
  $normalized = $normalized.Replace([char]0x201D, '"')
  $normalized = $normalized.Replace([char]0x00A0, ' ')
  $normalized = [regex]::Replace($normalized, "\s+", " ")
  return $normalized.Trim()
}

function ConvertTo-Slug {
  param([string]$Value)

  $normalized = Normalize-Text $Value
  $normalized = $normalized.ToLowerInvariant()
  $normalized = [regex]::Replace($normalized, "[^a-z0-9]+", "-")
  $normalized = $normalized.Trim("-")
  return $normalized
}

function Escape-Typescript {
  param([string]$Value)

  $escaped = $Value.Replace("\", "\\")
  $escaped = $escaped.Replace("'", "\'")
  return $escaped
}

function Get-DocxLines {
  param([string]$Path)

  Add-Type -AssemblyName System.IO.Compression.FileSystem

  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)

  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" } | Select-Object -First 1
    if (-not $entry) {
      throw "Missing word/document.xml in $Path"
    }

    $reader = New-Object System.IO.StreamReader($entry.Open())

    try {
      [xml]$xml = $reader.ReadToEnd()
    }
    finally {
      $reader.Dispose()
    }

    $namespaceManager = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $namespaceManager.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")

    $lines = New-Object System.Collections.Generic.List[string]
    $paragraphs = $xml.SelectNodes("//w:p", $namespaceManager)

    foreach ($paragraph in $paragraphs) {
      $textNodes = $paragraph.SelectNodes(".//w:t", $namespaceManager)
      $rawLine = ($textNodes | ForEach-Object { $_.InnerText }) -join ""
      $line = Normalize-Text $rawLine

      if ($line.Length -gt 0) {
        [void]$lines.Add($line)
      }
    }

    return $lines
  }
  finally {
    $zip.Dispose()
  }
}

function ConvertTo-Level {
  param([string]$Value)

  switch ((Normalize-Text $Value).ToLowerInvariant()) {
    "beginner" { return "beginner" }
    "intermediate" { return "intermediate" }
    "advanced" { return "advanced" }
    default { throw "Unsupported experience level: $Value" }
  }
}

function ConvertTo-LengthMetadata {
  param([string]$Value)

  $normalized = Normalize-Text $Value

  switch -Regex ($normalized.ToLowerInvariant()) {
    "^short" {
      return @{
        key = "short"
        label = "Short"
        minutes = 15
      }
    }
    "^medium" {
      return @{
        key = "medium"
        label = "Medium"
        minutes = 30
      }
    }
    "^long" {
      return @{
        key = "long"
        label = "Long"
        minutes = 45
      }
    }
    default { throw "Unsupported duration label: $Value" }
  }
}

function Test-IsLikelyDetail {
  param([string]$Value)

  $normalized = Normalize-Text $Value
  if ($normalized.Length -eq 0) {
    return $false
  }

  $wordCount = ($normalized -split " ").Count
  if ($wordCount -ge 10) {
    return $true
  }

  if ($normalized -match "[.!?]$") {
    return $true
  }

  return $false
}

function ConvertTo-SectionEntries {
  param([string[]]$Lines)

  $entries = New-Object System.Collections.Generic.List[object]
  $pendingTitle = $null
  $pendingDetails = New-Object System.Collections.Generic.List[string]

  foreach ($lineValue in $Lines) {
    $line = Normalize-Text $lineValue
    if ($line.Length -eq 0) {
      continue
    }

    if ($pendingTitle -and (Test-IsLikelyDetail $line)) {
      [void]$pendingDetails.Add($line)
      continue
    }

    if ($pendingTitle) {
      $detail = if ($pendingDetails.Count -gt 0) { ($pendingDetails -join " ") } else { $null }
      [void]$entries.Add(@{
          title = $pendingTitle
          detail = $detail
        })
      $pendingTitle = $null
      $pendingDetails.Clear()
    }

    if (Test-IsLikelyDetail $line) {
      [void]$entries.Add(@{
          title = $line
          detail = $null
        })
      continue
    }

    $pendingTitle = $line
  }

  if ($pendingTitle) {
    $detail = if ($pendingDetails.Count -gt 0) { ($pendingDetails -join " ") } else { $null }
    [void]$entries.Add(@{
        title = $pendingTitle
        detail = $detail
      })
  }

  return $entries
}

function Get-SectionLabel {
  param([string]$SectionId)

  switch ($SectionId) {
    "warmup" { return "Warm-up" }
    "main" { return "Main workout" }
    "cooldown" { return "Cool down" }
    default { throw "Unsupported section id: $SectionId" }
  }
}

function ConvertTo-Intensity {
  param(
    [string]$Name,
    [string]$Category,
    [string]$Level,
    [string]$Length
  )

  $haystack = "{0} {1}" -f (Normalize-Text $Name).ToLowerInvariant(), (Normalize-Text $Category).ToLowerInvariant()

  if ($haystack.Contains("hiit") -or $haystack.Contains("hypertrophy") -or $haystack.Contains("power") -or $haystack.Contains("walk-jog")) {
    return "high"
  }

  if ($Category -eq "strength") {
    if ($Level -eq "advanced") {
      return "high"
    }

    return "moderate"
  }

  if ($Category -eq "cardio") {
    if ($haystack.Contains("interval")) {
      if ($Level -eq "advanced") {
        return "high"
      }

      return "moderate"
    }

    if ($haystack.Contains("gentle") -or $haystack.Contains("easy") -or $haystack.Contains("meditation") -or $haystack.Contains("mindful")) {
      return "low"
    }

    if ($Level -eq "advanced" -and $Length -eq "long") {
      return "high"
    }

    return "moderate"
  }

  if ($Category -eq "yoga" -or $Category -eq "stretch" -or $Category -eq "mobility") {
    if ($Level -eq "advanced" -and ($haystack.Contains("advanced") -or $haystack.Contains("deep"))) {
      return "moderate"
    }

    return "low"
  }

  return "moderate"
}

function ConvertTo-Description {
  param(
    [string]$Category,
    [string]$Environment,
    [string]$Phase,
    [string]$Level
  )

  $environmentLabel = if ($Environment -eq "gym") { "in the gym" } else { "at home" }
  $levelLabel = switch ($Level) {
    "beginner" { "beginner" }
    "intermediate" { "intermediate" }
    "advanced" { "expert" }
  }

  return "{0} session for the {1} phase, built for {2} training {3}." -f (Get-Culture).TextInfo.ToTitleCase($Category), $Phase, $levelLabel, $environmentLabel
}

function Parse-WorkoutDocument {
  param(
    [string]$Path,
    [string]$Phase,
    [string]$Environment
  )

  $lines = Get-DocxLines $Path
  $workouts = New-Object System.Collections.Generic.List[object]

  for ($index = 0; $index -lt $lines.Count; $index += 1) {
    if ($lines[$index] -notmatch "^(Gym )?Workout\s+\d+\s+of\s+\d+$") {
      continue
    }

    $name = Normalize-Text $lines[$index + 1]
    $durationLine = Normalize-Text $lines[$index + 2]
    $experienceLine = Normalize-Text $lines[$index + 3]
    $categoryLine = Normalize-Text $lines[$index + 4]
    $equipmentLine = Normalize-Text $lines[$index + 5]

    $duration = Normalize-Text ($durationLine -replace "^Duration:\s*", "")
    $experience = Normalize-Text ($experienceLine -replace "^Experience Level:\s*", "")
    $category = (Normalize-Text ($categoryLine -replace "^Type:\s*", "")).ToLowerInvariant()
    $equipment = Normalize-Text ($equipmentLine -replace "^Equipment:\s*", "")
    $lengthMetadata = ConvertTo-LengthMetadata $duration
    $level = ConvertTo-Level $experience

    $sectionId = $null
    $sectionLines = @{
      warmup = New-Object System.Collections.Generic.List[string]
      main = New-Object System.Collections.Generic.List[string]
      cooldown = New-Object System.Collections.Generic.List[string]
    }

    $cursor = $index + 6
    :sectionLoop while ($cursor -lt $lines.Count -and $lines[$cursor] -notmatch "^(Gym )?Workout\s+\d+\s+of\s+\d+$") {
      $line = Normalize-Text $lines[$cursor]

      switch -Regex ($line) {
        "^(Warm-Up|WARM-UP)$" {
          $sectionId = "warmup"
          $cursor += 1
          continue sectionLoop
        }
        "^(Main Workout.*|MAIN WORKOUT)$" {
          $sectionId = "main"
          $cursor += 1
          continue sectionLoop
        }
        "^(Cool Down|COOL DOWN)$" {
          $sectionId = "cooldown"
          $cursor += 1
          continue sectionLoop
        }
      }

      if ($sectionId) {
        [void]$sectionLines[$sectionId].Add($line)
      }

      $cursor += 1
    }

    $sections = @(
      @{
        id = "warmup"
        label = Get-SectionLabel "warmup"
        entries = @(ConvertTo-SectionEntries $sectionLines.warmup)
      },
      @{
        id = "main"
        label = Get-SectionLabel "main"
        entries = @(ConvertTo-SectionEntries $sectionLines.main)
      },
      @{
        id = "cooldown"
        label = Get-SectionLabel "cooldown"
        entries = @(ConvertTo-SectionEntries $sectionLines.cooldown)
      }
    )

    $workoutId = "{0}-{1}" -f $Environment, (ConvertTo-Slug $name)
    $intensity = ConvertTo-Intensity -Name $name -Category $category -Level $level -Length $lengthMetadata.key
    $description = ConvertTo-Description -Category $category -Environment $Environment -Phase $Phase -Level $level

    [void]$workouts.Add(@{
        id = $workoutId
        slug = ConvertTo-Slug $name
        name = $name
        phase = $Phase
        environment = $Environment
        category = $category
        level = $level
        length = $lengthMetadata.key
        lengthLabel = $lengthMetadata.label
        intensity = $intensity
        durationLabel = $duration
        estDurationMinutes = $lengthMetadata.minutes
        equipmentLabel = $equipment
        description = $description
        sections = $sections
      })

    $index = $cursor - 1
  }

  return $workouts
}

function ConvertTo-TypescriptLiteral {
  param($Value, [int]$IndentLevel = 0)

  $indent = ("  " * $IndentLevel)
  $nextIndentLevel = $IndentLevel + 1
  $nextIndent = ("  " * $nextIndentLevel)

  if ($null -eq $Value) {
    return "null"
  }

  if ($Value -is [string]) {
    return "'$(Escape-Typescript $Value)'"
  }

  if ($Value -is [bool]) {
    return $Value.ToString().ToLowerInvariant()
  }

  if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
    return $Value.ToString([Globalization.CultureInfo]::InvariantCulture)
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $properties = @()
    foreach ($key in $Value.Keys) {
      $properties += "{0}{1}: {2}" -f $nextIndent, $key, (ConvertTo-TypescriptLiteral -Value $Value[$key] -IndentLevel $nextIndentLevel)
    }

    return "{`n" + ($properties -join ",`n") + "`n" + $indent + "}"
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    $items = @()
    foreach ($item in $Value) {
      $items += "{0}{1}" -f $nextIndent, (ConvertTo-TypescriptLiteral -Value $item -IndentLevel $nextIndentLevel)
    }

    return "[`n{0}`n{1}]" -f ($items -join ",`n"), $indent
  }

  throw "Unsupported value type: $($Value.GetType().FullName)"
}

$scriptRoot = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$referencesRoot = Resolve-Path (Join-Path $scriptRoot "..\\..\\References")
$outputPath = Join-Path (Resolve-Path (Join-Path $scriptRoot "..")) "src\\features\\workouts\\data\\referenceWorkouts.generated.ts"

$documentConfigs = @(
  @{
    path = Join-Path $referencesRoot "Menstrual_Phase_Workouts_version 2(1).docx"
    phase = "menstrual"
    environment = "home"
  },
  @{
    path = Join-Path $referencesRoot "Menstrual_Phase_Gym_Workouts_version 2(1).docx"
    phase = "menstrual"
    environment = "gym"
  }
)

$allWorkouts = New-Object System.Collections.Generic.List[object]
foreach ($config in $documentConfigs) {
  $parsedWorkouts = Parse-WorkoutDocument -Path $config.path -Phase $config.phase -Environment $config.environment
  foreach ($workout in $parsedWorkouts) {
    [void]$allWorkouts.Add($workout)
  }
}

$generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss K", [Globalization.CultureInfo]::InvariantCulture)
$typescript = @"
import type { ReferenceWorkout } from "@/features/workouts/data/referenceWorkoutsCatalog";

// Generated by scripts/import-reference-workouts.ps1 on $generatedAt.
export const generatedReferenceWorkouts: ReferenceWorkout[] = $(ConvertTo-TypescriptLiteral -Value $allWorkouts -IndentLevel 0);
"@

[System.IO.File]::WriteAllText($outputPath, $typescript + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Generated $($allWorkouts.Count) workouts at $outputPath"
