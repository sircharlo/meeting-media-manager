# Stands in for M³'s media window during the live Zoom test: a window with
# the same title (so Zoom's share picker lists it) and a changing colour, so
# a share is visibly live. Closes itself after the given number of seconds.
# With -Title, it's a decoy window instead, to crowd Zoom's share picker;
# with -TopMost too, an always-on-top one that can cover it.
#
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/zoom-live/fake-media-window.ps1 [-Seconds 900] [-Title <title>] [-X 40] [-Y 40] [-TopMost]

param(
  [int]$Seconds = 900,
  [string]$Title = "Media Player - M$([char]0x00B3)", # src/constants/zoom.ts MEDIA_WINDOW_TITLE
  [int]$X = 40,
  [int]$Y = 40,
  [switch]$TopMost
)

Add-Type -AssemblyName System.Windows.Forms, System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = $Title
$form.Width = 640
$form.Height = 360
$form.StartPosition = 'Manual'
$form.Location = New-Object System.Drawing.Point $X, $Y
$form.TopMost = $TopMost.IsPresent

$label = New-Object System.Windows.Forms.Label
$label.Dock = 'Fill'
$label.TextAlign = 'MiddleCenter'
$label.ForeColor = 'White'
$label.Font = New-Object System.Drawing.Font 'Segoe UI', 28
$label.Text = $Title
$form.Controls.Add($label)

$colors = @('#1f6feb', '#8957e5', '#2da44e', '#bf8700')
$script:tick = 0
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
  $label.BackColor = [System.Drawing.ColorTranslator]::FromHtml($colors[$script:tick % $colors.Count])
  $script:tick++
  if ($script:tick -ge $Seconds) { $form.Close() }
})
$label.BackColor = [System.Drawing.ColorTranslator]::FromHtml($colors[0])
$timer.Start()

[System.Windows.Forms.Application]::Run($form)
