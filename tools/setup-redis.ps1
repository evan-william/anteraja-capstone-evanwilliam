$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$cacheRuntime = Join-Path $projectRoot '.private\redis'
$binary = Join-Path $cacheRuntime 'runtime\Memurai\memurai.exe'
if (Test-Path -LiteralPath $binary) {
    Write-Host 'Runtime Redis lokal sudah tersedia.'
    exit 0
}
New-Item -ItemType Directory -Path $cacheRuntime -Force | Out-Null
# Get the signed download URL from the publisher; never print its temporary token.
$link = Invoke-RestMethod 'https://www.memurai.com/api/request-download-link?version=windows-redis'
$downloadUri = [uri]$link.url
if ($downloadUri.Scheme -ne 'https' -or $downloadUri.Host -ne 'download.memurai.com') {
    throw 'Unexpected download host. Open the official Memurai download page.'
}
$installer = Join-Path $cacheRuntime 'memurai.msi'
Invoke-WebRequest $downloadUri.AbsoluteUri -OutFile $installer -UseBasicParsing
$signature = Get-AuthenticodeSignature -LiteralPath $installer
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notlike '*Janea Systems*') {
    throw 'Installer signature does not match the expected publisher.'
}
# Administrative extraction only: no service, PATH changes, or firewall rules.
$destination = Join-Path $cacheRuntime 'runtime'
$log = Join-Path $cacheRuntime 'extract.log'
$arguments = '/a "' + $installer + '" /qn TARGETDIR="' + $destination + '" /l*v "' + $log + '"'
$process = Start-Process 'msiexec.exe' -ArgumentList $arguments -PassThru -Wait -WindowStyle Hidden
if ($process.ExitCode -ne 0 -or !(Test-Path -LiteralPath $binary)) {
    throw "Extraction failed (exit $($process.ExitCode)); check .private/redis/extract.log."
}
Write-Host 'Redis-compatible runtime ready. Run npm run dev, then artisan operations:cache-check.'
