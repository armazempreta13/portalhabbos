# setup-cloudflare-token.ps1
# Configura automaticamente o CLOUDFLARE_API_TOKEN no projeto de Pages via API
# Uso: .\setup-cloudflare-token.ps1 -Token "seu_token_aqui"

param(
    [string]$Token,
    [string]$AccountId = "f165980a213718a04990d66be1772f66",
    [string]$ProjectName = "portalhabboss"
)

if (-not $Token) {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "  Configurador de Token - Cloudflare Pages" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PASSO 1: Acesse https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor Yellow
    Write-Host "PASSO 2: Clique em 'Create Token'" -ForegroundColor Yellow
    Write-Host "PASSO 3: Use o template 'Edit Cloudflare Workers' OU adicione:" -ForegroundColor Yellow
    Write-Host "         - Account -> Cloudflare Pages -> Edit" -ForegroundColor White
    Write-Host "PASSO 4: Gere e copie o token" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host "Cole aqui o token com permissao Cloudflare Pages:Edit"
}

Write-Host ""
Write-Host "Configurando token no projeto '$ProjectName'..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

# Verifica se o token e valido
Write-Host "Verificando token..." -ForegroundColor Gray
try {
    $verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -Method Get
    if (-not $verify.success) {
        Write-Host "ERRO: Token invalido!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Token valido!" -ForegroundColor Green
} catch {
    Write-Host "ERRO ao verificar token: $_" -ForegroundColor Red
    exit 1
}

# Configura o CLOUDFLARE_API_TOKEN como variavel secreta no projeto Pages
$body = @{
    deployment_configs = @{
        production = @{
            env_vars = @{
                CLOUDFLARE_API_TOKEN = @{
                    value = $Token
                    type  = "secret_text"
                }
            }
        }
    }
} | ConvertTo-Json -Depth 10

$url = "https://api.cloudflare.com/client/v4/accounts/$AccountId/pages/projects/$ProjectName"

try {
    $response = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body $body
    if ($response.success) {
        Write-Host ""
        Write-Host "=====================================================" -ForegroundColor Green
        Write-Host "  SUCESSO! Token configurado no projeto Pages!" -ForegroundColor Green
        Write-Host "=====================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Agora va ao Cloudflare Pages, abra o projeto '$ProjectName'" -ForegroundColor Yellow
        Write-Host "e clique em 'Retry deployment' no ultimo deploy com falha." -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "ERRO na API: $($response.errors | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    Write-Host "ERRO na requisicao: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possivel causa: o token nao tem permissao 'Cloudflare Pages: Edit'" -ForegroundColor Yellow
}
