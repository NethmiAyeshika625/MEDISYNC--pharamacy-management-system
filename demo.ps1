# MEDISYNC Demo Script
# This script helps you quickly seed the database and start the development servers

param(
    [switch]$Seed,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All
)

function Write-Header {
    param([string]$Text)
    Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host ("=" * 60) -ForegroundColor Cyan
}

function Start-Service {
    param([string]$ServiceName, [string]$Path, [string]$Command)
    
    Write-Host "`nStarting $ServiceName..." -ForegroundColor Green
    Push-Location $Path
    
    if ($ServiceName -eq "Backend") {
        Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c npm run dev"
    } else {
        Start-Process -NoNewWindow -FilePath "cmd" -ArgumentList "/c npm run dev"
    }
    
    Pop-Location
    Write-Host "$ServiceName started!" -ForegroundColor Green
}

# Display menu if no parameters
if (-not ($Seed -or $Backend -or $Frontend -or $All)) {
    Write-Header "MEDISYNC Demo Setup"
    Write-Host @"
Welcome to MEDISYNC! Choose what you want to do:

Usage: .\demo.ps1 [option]

Options:
  -Seed       Seed the database with demo data (5 pharmacies, 5 patients, etc.)
  -Backend    Start the backend server (port 5000)
  -Frontend   Start the frontend server (port 5173)
  -All        Do everything: seed, then start both servers

Examples:
  .\demo.ps1 -Seed                   # Just seed the database
  .\demo.ps1 -Backend                # Just start backend
  .\demo.ps1 -Frontend               # Just start frontend
  .\demo.ps1 -All                    # Full setup: seed + both servers

Demo Credentials:
  Pharmacist: pharmacist@medisync.test / password123
  Patient:    patient@medisync.test / password123
  Admin:      admin@medisync.test / password123

After services start:
  Backend:  http://localhost:5000
  Frontend: http://localhost:5173

"@
    Write-Host "Pro Tip: Open two browser windows and login to both to see real-time updates!" -ForegroundColor Yellow
    exit 0
}

if ($All) {
    $Seed = $true
    $Backend = $true
    $Frontend = $true
}

# Seed the database
if ($Seed) {
    Write-Header "Seeding Database"
    
    $backendPath = Join-Path (Get-Location) "backend"
    
    if (-not (Test-Path $backendPath)) {
        Write-Host "Error: backend directory not found" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $backendPath
    
    Write-Host "Installing dependencies (if needed)..." -ForegroundColor Yellow
    npm install --silent
    
    Write-Host "Running seed script..." -ForegroundColor Yellow
    npm run seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Database seeded successfully!" -ForegroundColor Green
        Write-Host "`nCreated:" -ForegroundColor Cyan
        Write-Host "  • 1 Admin user" -ForegroundColor White
        Write-Host "  • 5 Pharmacists with full pharmacy setups" -ForegroundColor White
        Write-Host "  • 5 Patients for testing" -ForegroundColor White
        Write-Host "  • 5 Pharmacies with 8 medicines each" -ForegroundColor White
        Write-Host "  • Sample prescriptions and orders" -ForegroundColor White
    } else {
        Write-Host "`n✗ Seeding failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
}

# Start services
if ($Backend) {
    Start-Service "Backend" (Join-Path (Get-Location) "backend") "npm run dev"
}

if ($Frontend) {
    Start-Service "Frontend" (Join-Path (Get-Location) "frontend") "npm run dev"
}

if ($Backend -and $Frontend) {
    Write-Header "Services Started"
    Write-Host "`n✓ Backend running at: http://localhost:5000" -ForegroundColor Green
    Write-Host "✓ Frontend running at: http://localhost:5173" -ForegroundColor Green
    
    Write-Host "`nTest Flow:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:5173 in your browser" -ForegroundColor White
    Write-Host "2. Login as pharmacist@medisync.test / password123" -ForegroundColor White
    Write-Host "3. Go to 'Stock Control' and update a medicine" -ForegroundColor White
    Write-Host "4. Open a new window and login as patient@medisync.test" -ForegroundColor White
    Write-Host "5. Search for pharmacies and use geolocation" -ForegroundColor White
    Write-Host "6. Watch for real-time notifications!" -ForegroundColor White
    
    Write-Host "`nPress Ctrl+C in both terminals to stop the servers" -ForegroundColor Yellow
}

Write-Host ""
