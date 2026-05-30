param(
    [switch]$Foreground
)

$ErrorActionPreference = "Stop"
$script = Join-Path $PSScriptRoot "ai_chatbot\start_ai.ps1"
& $script @PSBoundParameters
