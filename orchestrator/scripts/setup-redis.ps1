# Script PowerShell pour démarrer Redis localement sur Windows
# Conforme aux obligations de communication Redis Streams

Write-Host "=== REDIS SETUP POUR COMMUNICATION INTER-AGENTS ===" -ForegroundColor Cyan
Write-Host "Selon spécifications ONBOARDING_AI.md" -ForegroundColor Gray
Write-Host ""

# Vérifier si Redis est déjà en cours d'exécution
$redisProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue

if ($redisProcess) {
    Write-Host "✅ Redis est déjà en cours d'exécution (PID: $($redisProcess.Id))" -ForegroundColor Green
    
    # Test de connectivité
    try {
        $result = redis-cli ping 2>$null
        if ($result -eq "PONG") {
            Write-Host "✅ Connectivité Redis confirmée" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Redis process trouvé mais pas de réponse PING" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  redis-cli non disponible pour test" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Redis n'est pas en cours d'exécution" -ForegroundColor Red
    Write-Host ""
    
    # Chercher l'installation Redis
    $redisPaths = @(
        "C:\Program Files\Redis\redis-server.exe",
        "C:\Redis\redis-server.exe",
        "$env:USERPROFILE\redis\redis-server.exe",
        "$env:ProgramFiles\Redis\redis-server.exe"
    )
    
    $redisPath = $null
    foreach ($path in $redisPaths) {
        if (Test-Path $path) {
            $redisPath = $path
            break
        }
    }
    
    if ($redisPath) {
        Write-Host "✅ Redis trouvé: $redisPath" -ForegroundColor Green
        Write-Host "🚀 Démarrage de Redis..." -ForegroundColor Blue
        
        try {
            Start-Process -FilePath $redisPath -WindowStyle Minimized
            Start-Sleep -Seconds 3
            
            # Vérifier que Redis a démarré
            $newProcess = Get-Process -Name "redis-server" -ErrorAction SilentlyContinue
            if ($newProcess) {
                Write-Host "✅ Redis démarré avec succès (PID: $($newProcess.Id))" -ForegroundColor Green
            } else {
                Write-Host "❌ Échec du démarrage de Redis" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Erreur lors du démarrage: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Redis non trouvé sur ce système" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Options d'installation:" -ForegroundColor Yellow
        Write-Host "  1. Docker:    docker run -d --name redis -p 6379:6379 redis:latest" -ForegroundColor Gray
        Write-Host "  2. WSL:       sudo apt install redis-server && sudo service redis-server start" -ForegroundColor Gray
        Write-Host "  3. Chocolatey: choco install redis-64" -ForegroundColor Gray
        Write-Host "  4. Manuel:    https://github.com/MicrosoftArchive/redis/releases" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== TEST DE COMMUNICATION ===" -ForegroundColor Cyan

# Test avec Node.js si disponible
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "🧪 Test des streams Redis..." -ForegroundColor Blue
    
    $testScript = Join-Path $PSScriptRoot "test-redis.cjs"
    if (Test-Path $testScript) {
        try {
            node $testScript
            Write-Host "✅ Test Redis Streams réussi" -ForegroundColor Green
        } catch {
            Write-Host "❌ Test Redis Streams échoué" -ForegroundColor Red
            Write-Host "Erreur: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Script de test non trouvé: $testScript" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Node.js non disponible pour test automatique" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== CONFIGURATION ===" -ForegroundColor Cyan
Write-Host "Variable d'environnement recommandée:" -ForegroundColor Gray
Write-Host "REDIS_URL=redis://127.0.0.1:6379" -ForegroundColor White
Write-Host ""
Write-Host "Canaux Redis utilisés (ONBOARDING_AI.md):" -ForegroundColor Gray
Write-Host "  - agents:global" -ForegroundColor White
Write-Host "  - agents:orchestrator" -ForegroundColor White
Write-Host "  - agents:pair:team03" -ForegroundColor White
Write-Host ""

if ($env:REDIS_URL) {
    Write-Host "✅ Variable REDIS_URL configurée: $env:REDIS_URL" -ForegroundColor Green
} else {
    Write-Host "⚠️  Variable REDIS_URL non configurée (utilisera défaut)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== HEARTBEAT SERVICE ===" -ForegroundColor Cyan
$heartbeatScript = Join-Path $PSScriptRoot "heartbeat-service.cjs"
if (Test-Path $heartbeatScript) {
    Write-Host "✅ Service heartbeat disponible: $heartbeatScript" -ForegroundColor Green
    Write-Host "Pour démarrer: node $heartbeatScript" -ForegroundColor Gray
} else {
    Write-Host "❌ Service heartbeat manquant: $heartbeatScript" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 COMMUNICATION REDIS READY" -ForegroundColor Green -BackgroundColor DarkGreen
