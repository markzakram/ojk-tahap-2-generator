param([Parameter(Mandatory=$true)][string]$Docx,[Parameter(Mandatory=$true)][string]$Pdf,[Parameter(Mandatory=$true)][string]$PidFile)
$ErrorActionPreference='Stop'
$existingWordIds=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
$wordQa=$null
$docQa=$null
$ownsWordQa=$false
try {
  $wordQa=New-Object -ComObject Word.Application
  $newWordQa=@(Get-Process WINWORD -ErrorAction SilentlyContinue | Where-Object { $existingWordIds -notcontains $_.Id })
  if($newWordQa.Count -ne 1){throw 'Word QA must use a separate application instance.'}
  $wordQaPid=$newWordQa[0].Id
  $ownsWordQa=$true
  [IO.File]::WriteAllText($PidFile,[string]$wordQaPid)
  $wordQa.Visible=$false
  $wordQa.DisplayAlerts=0
  $wordQa.AutomationSecurity=3
  $docQa=$wordQa.Documents.Open($Docx,$false,$true,$false)
  $docQa.ExportAsFixedFormat($Pdf,17)
  Write-Output ('Rendered: '+$Pdf)
} finally {
  $wordQaSave=0
  try {if($docQa){$docQa.Close([ref]$wordQaSave);[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($docQa)}}
  finally {if($wordQa){if($ownsWordQa){$wordQa.Quit([ref]$wordQaSave)};[void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordQa)}}
}
