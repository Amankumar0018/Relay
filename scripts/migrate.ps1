# ==============================================================================
# Relay Secure Local Database Migration Runner
# ==============================================================================
# Safely prompts for the Neon PostgreSQL pooled connection string locally.
# Protects credentials: URL is never printed in logs, commit messages, or chat.
# Automatically cleans up environment variables immediately after execution.
# ==============================================================================

$ErrorActionPreference = "Stop"

function Get-ConnectionUrl {
    # 1. Check if NEON_DATABASE_URL or DATABASE_URL is already set in environment
    if ($env:NEON_DATABASE_URL -and $env:NEON_DATABASE_URL.Trim() -ne "") {
        return $env:NEON_DATABASE_URL.Trim()
    }
    if ($env:DATABASE_URL -and -not $env:DATABASE_URL.StartsWith("sqlite") -and $env:DATABASE_URL.Trim() -ne "") {
        return $env:DATABASE_URL.Trim()
    }

    # 2. If running in an interactive console, prompt with Read-Host
    try {
        if ([System.Environment]::UserInteractive -and [System.Console]::KeyAvailable -ne $null) {
            $inputUrl = Read-Host "Paste Neon pooled connection URL"
            if ($inputUrl -and $inputUrl.Trim() -ne "") {
                return $inputUrl.Trim()
            }
        }
    } catch {}

    # 3. Fallback: Display secure native desktop prompt dialog (TopMost, masked)
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Relay - Neon PostgreSQL Migration"
    $form.Size = New-Object System.Drawing.Size(560, 190)
    $form.StartPosition = "CenterScreen"
    $form.TopMost = $true
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false

    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(15, 15)
    $label.Size = New-Object System.Drawing.Size(515, 20)
    $label.Text = "Paste Neon pooled connection URL (secure local input, masked):"
    $form.Controls.Add($label)

    $textBox = New-Object System.Windows.Forms.TextBox
    $textBox.Location = New-Object System.Drawing.Point(15, 42)
    $textBox.Size = New-Object System.Drawing.Size(515, 25)
    $textBox.UseSystemPasswordChar = $true
    $form.Controls.Add($textBox)

    $okButton = New-Object System.Windows.Forms.Button
    $okButton.Location = New-Object System.Drawing.Point(350, 90)
    $okButton.Size = New-Object System.Drawing.Size(85, 32)
    $okButton.Text = "Migrate"
    $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
    $form.AcceptButton = $okButton
    $form.Controls.Add($okButton)

    $cancelButton = New-Object System.Windows.Forms.Button
    $cancelButton.Location = New-Object System.Drawing.Point(445, 90)
    $cancelButton.Size = New-Object System.Drawing.Size(85, 32)
    $cancelButton.Text = "Cancel"
    $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.CancelButton = $cancelButton
    $form.Controls.Add($cancelButton)

    $dialogResult = $form.ShowDialog()
    if ($dialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
        return $textBox.Text.Trim()
    }
    return ""
}

$connUrl = Get-ConnectionUrl

if (-not $connUrl -or $connUrl -eq "") {
    Write-Host "`n[CANCELLED] Migration cancelled: no connection URL provided." -ForegroundColor Yellow
    exit 1
}

# Temporarily set NEON_DATABASE_URL for the Python child process
$env:NEON_DATABASE_URL = $connUrl

try {
    # Resolve Python virtual environment executable
    $pythonExe = if (Test-Path "backend\.venv\Scripts\python.exe") {
        "backend\.venv\Scripts\python.exe"
    } else {
        "python"
    }

    Write-Host "`n[INFO] Target connection string loaded securely into memory." -ForegroundColor Cyan
    Write-Host "[INFO] Initiating database migration against target PostgreSQL...`n" -ForegroundColor Cyan

    & $pythonExe scripts/migrate_sqlite_to_postgres.py
    $exitCode = $LASTEXITCODE
}
finally {
    # Strictly clear the environment variable from memory
    Remove-Item Env:NEON_DATABASE_URL -ErrorAction SilentlyContinue
    Write-Host "`n[SECURITY] Environment variable NEON_DATABASE_URL wiped from memory." -ForegroundColor Green
}

exit $exitCode
