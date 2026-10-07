param(
    [switch]$NoBrowser,
    [switch]$Production,
    [ValidateRange(0, 65535)][int]$FrontendPort = 0,
    [ValidateRange(0, 65535)][int]$BackendPort = 0
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

function Find-FreePort([int]$first) {
    for ($candidate = $first; $candidate -le $first + 50; $candidate++) {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidate)
        try { $listener.Start(); return $candidate }
        catch [System.Net.Sockets.SocketException] { }
        finally { $listener.Stop() }
    }
    throw "Tidak ada port kosong di rentang $first sampai $($first + 50)."
}

# a non-inherited Windows job handle owns only this launcher's process tree.
# closing the window releases that handle, even if finally cannot execute.
Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
public sealed class AnterajaLocalJob : IDisposable {
    [StructLayout(LayoutKind.Sequential)] struct BasicLimits {
        public long ProcessTime, JobTime;
        public uint Flags;
        public UIntPtr MinWorkingSet, MaxWorkingSet;
        public uint ActiveProcesses;
        public UIntPtr Affinity;
        public uint Priority, Scheduling;
    }
    [StructLayout(LayoutKind.Sequential)] struct IoCounters {
        public ulong ReadOps, WriteOps, OtherOps, ReadBytes, WriteBytes, OtherBytes;
    }
    [StructLayout(LayoutKind.Sequential)] struct ExtendedLimits {
        public BasicLimits Basic;
        public IoCounters Io;
        public UIntPtr ProcessMemory, JobMemory, PeakProcessMemory, PeakJobMemory;
    }
    [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
    static extern IntPtr CreateJobObject(IntPtr attributes, string name);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool SetInformationJobObject(IntPtr job, int infoClass, ref ExtendedLimits limits, uint length);
    [DllImport("kernel32.dll", SetLastError=true)]
    static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);
    [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
    IntPtr handle;
    public AnterajaLocalJob() {
        handle = CreateJobObject(IntPtr.Zero, null);
        if (handle == IntPtr.Zero) throw new Win32Exception(Marshal.GetLastWin32Error());
        var limits = new ExtendedLimits();
        limits.Basic.Flags = 0x2000; // kill on last handle close
        if (!SetInformationJobObject(handle, 9, ref limits, (uint)Marshal.SizeOf(limits))) {
            int error = Marshal.GetLastWin32Error();
            Dispose();
            throw new Win32Exception(error);
        }
    }
    public void Attach(IntPtr process) {
        if (!AssignProcessToJobObject(handle, process)) throw new Win32Exception(Marshal.GetLastWin32Error());
    }
    public void Dispose() {
        if (handle != IntPtr.Zero) { CloseHandle(handle); handle = IntPtr.Zero; }
    }
}
'@

$serverProcess = $null
$serverJob = $null
$exitCode = 0
try {
    foreach ($required in @('node_modules/vite/bin/vite.js', 'backend/vendor/autoload.php', 'backend/.env', '.env.local')) {
        if (!(Test-Path -LiteralPath $required)) { throw "File belum tersedia: $required. Lihat LARAVEL_RUN.md untuk setup." }
    }
    $nodePath = (Get-Command node -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
    if ($FrontendPort -eq 0) { $FrontendPort = Find-FreePort 3000 }
    if ($Production -and !(Test-Path -LiteralPath 'dist/index.html')) { throw 'Jalankan npm run build sebelum mode Production.' }
    if ($BackendPort -eq 0) { $BackendPort = Find-FreePort 8089 }
    if ($FrontendPort -eq $BackendPort) { throw 'Port frontend dan backend harus berbeda.' }
    $env:PORT = [string]$FrontendPort
    $env:API_PORT = [string]$BackendPort
    $env:ANTERAJA_LAUNCHER_GATE = '1'
    $frontUrl = "http://127.0.0.1:$FrontendPort"
    $apiUrl = "http://127.0.0.1:$BackendPort/api/health"
    if ($Production) { $apiUrl = "$frontUrl/api/health" }
    Write-Host "`nAnteraja - React + Laravel" -ForegroundColor Magenta
    Write-Host "Aplikasi: $frontUrl"
    Write-Host "API:      $apiUrl"
    Write-Host 'Biarkan jendela ini terbuka. Tutup jendela atau tekan Ctrl+C untuk berhenti.'

    $serverJob = [AnterajaLocalJob]::new()
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $nodePath
    $startInfo.Arguments = if ($Production) { 'tools/serve-laravel-react.mjs' } else { 'tools/dev-laravel-react.mjs' }
    $startInfo.WorkingDirectory = $projectRoot
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $serverProcess = [System.Diagnostics.Process]::Start($startInfo)
    $serverJob.Attach($serverProcess.Handle)
    $serverProcess.StandardInput.WriteLine('start')
    $serverProcess.StandardInput.Close()

    $deadline = [DateTime]::UtcNow.AddSeconds(45)
    $ready = $false
    while (!$serverProcess.HasExited -and !$ready -and [DateTime]::UtcNow -lt $deadline) {
        try {
            $health = Invoke-RestMethod -Uri $apiUrl -TimeoutSec 2
            $front = Invoke-WebRequest -Uri $frontUrl -UseBasicParsing -TimeoutSec 2
            $ready = $health.success -eq $true -and $health.data.runtime -eq 'laravel' -and $front.StatusCode -eq 200
        } catch { }
        if (!$ready) { Start-Sleep -Milliseconds 300 }
    }
    if (!$ready -and !$serverProcess.HasExited) { throw 'Server belum siap setelah 45 detik. Periksa log startup di atas.' }
    if ($ready) {
        Write-Host "Siap: $frontUrl" -ForegroundColor Green
        if (!$NoBrowser) {
            # open the user's browser, not a second server console.
            try { [System.Diagnostics.Process]::Start($frontUrl) | Out-Null }
            catch { Write-Warning "Browser tidak terbuka otomatis. Buka $frontUrl secara manual." }
        }
    }
    while (!$serverProcess.HasExited) { Start-Sleep -Milliseconds 300 }
    $exitCode = $serverProcess.ExitCode
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    $exitCode = 1
} finally {
    if ($null -ne $serverJob) { $serverJob.Dispose() }
    # assignment failure leaves only the gated launcher, without any servers.
    if ($null -ne $serverProcess) {
        if (!$serverProcess.HasExited) { $serverProcess.Kill() }
        $serverProcess.Dispose()
    }
}
exit $exitCode
