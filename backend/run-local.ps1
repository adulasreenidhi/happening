$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repositoryRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Local .env file not found. Copy .env.example to .env and configure the database settings first."
}

$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    $entry = $line.Trim()
    if (-not $entry -or $entry.StartsWith('#')) {
        continue
    }

    $separator = $entry.IndexOf('=')
    if ($separator -le 0) {
        continue
    }

    $name = $entry.Substring(0, $separator).Trim()
    $value = $entry.Substring($separator + 1).Trim()
    if ($value.Length -ge 2 -and
        (($value[0] -eq '"' -and $value[$value.Length - 1] -eq '"') -or
            ($value[0] -eq "'" -and $value[$value.Length - 1] -eq "'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    $settings[$name] = $value
}

foreach ($name in @('MYSQL_DATABASE', 'DB_USERNAME', 'DB_PASSWORD')) {
    if (-not $settings.ContainsKey($name) -or -not $settings[$name]) {
        throw "Required setting $name is missing or empty in the local .env file."
    }
}

$env:DB_URL = if ($settings.ContainsKey('DB_URL') -and $settings['DB_URL']) {
    $settings['DB_URL']
} else {
    "jdbc:mysql://localhost:3306/$($settings['MYSQL_DATABASE'])"
}
$env:DB_USERNAME = $settings['DB_USERNAME']
$env:DB_PASSWORD = $settings['DB_PASSWORD']
$env:FRONTEND_ORIGIN = if ($settings.ContainsKey('FRONTEND_ORIGIN') -and $settings['FRONTEND_ORIGIN']) {
    $settings['FRONTEND_ORIGIN']
} else {
    'http://localhost:5173'
}

$secret = $settings['JWT_SECRET']
if (-not $secret) {
    $keyBytes = New-Object byte[] 32
    $randomNumberGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomNumberGenerator.GetBytes($keyBytes)
    } finally {
        $randomNumberGenerator.Dispose()
    }
    $secret = [Convert]::ToBase64String($keyBytes)
    Write-Host 'No JWT_SECRET found in .env; using a fresh, temporary 32-byte key for this local run.'
    Write-Host 'Tokens from this run will not remain valid after the application restarts.'
} else {
    try {
        $decodedSecret = [Convert]::FromBase64String($secret)
    } catch {
        throw 'JWT_SECRET in .env must be valid Base64. The value was not printed.'
    }
    if ($decodedSecret.Length -lt 32) {
        throw "JWT_SECRET in .env decodes to $($decodedSecret.Length) bytes; at least 32 are required. The value was not printed."
    }
}
$env:JWT_SECRET = $secret

foreach ($name in @(
        'JWT_EXPIRATION_MS',
        'AI_ASSISTANT_ENABLED',
        'OPENAI_API_KEY',
        'OPENAI_BASE_URL',
        'OPENAI_CHAT_MODEL',
        'OPENAI_EMBEDDING_MODEL',
        'JPA_DDL_AUTO'
    )) {
    if ($settings.ContainsKey($name)) {
        [Environment]::SetEnvironmentVariable($name, $settings[$name], 'Process')
    }
}

Write-Host 'Starting the local backend. JWT_SECRET and database credentials are not printed.'
Set-Location (Join-Path $PSScriptRoot '.')
& .\mvnw.cmd spring-boot:run
exit $LASTEXITCODE
