# Starts M³'s Zoom helper (see ZoomHelper.cs) with nothing but what ships
# with Windows: Windows PowerShell 5.1 and the .NET Framework's C# compiler.
#
# M³ runs: powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass
#            -File zoom-helper.ps1 -CacheDir <folder>
# The helper then reads JSON requests on stdin and answers on stdout. Its
# first line is {"ready":true} or, if it couldn't start, {"ready":false,...}.

param(
  # Where the generated UI Automation interop assembly is kept between runs.
  [string]$CacheDir = (Join-Path $env:LOCALAPPDATA 'M3\zoom-helper')
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8

function Write-StartupFailure([string]$reason, [string]$detail) {
  $failure = @{ ready = $false; error = $reason; detail = $detail } | ConvertTo-Json -Compress
  [Console]::Out.WriteLine($failure)
  [Console]::Out.Flush()
}

if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
  # Locked-down computers (AppLocker / Device Guard) run PowerShell in a
  # restricted mode that can't compile or call native code.
  Write-StartupFailure 'powershell-restricted' "$($ExecutionContext.SessionState.LanguageMode)"
  exit 1
}

try {
  # The native COM UI Automation API is described by a type library inside
  # Windows' own UIAutomationCore.dll; .NET turns it into an interop assembly
  # once per Windows version, then reuses it.
  $core = Join-Path $env:SystemRoot 'System32\UIAutomationCore.dll'
  $version = ((Get-Item $core).VersionInfo.FileVersion -replace '[^\w.]', '_')
  # The file name is the assembly's identity, so it stays the same; the
  # folder tells Windows versions apart.
  $interop = Join-Path (Join-Path $CacheDir $version) 'Interop.UIAutomationClient.dll'

  if (-not (Test-Path $interop)) {
    New-Item -ItemType Directory -Force (Split-Path $interop) | Out-Null
    Add-Type -TypeDefinition @'
using System;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.ComTypes;

public class M3TypeLibSink : ITypeLibImporterNotifySink
{
    public void ReportEvent(ImporterEventKind kind, int code, string message) { }
    public Assembly ResolveRef(object typeLib) { return null; }
}

public static class M3TypeLibConverter
{
    [DllImport("oleaut32.dll", CharSet = CharSet.Unicode, PreserveSig = false)]
    static extern void LoadTypeLibEx(string file, int regKind, out ITypeLib typeLib);

    public static void Convert(string typeLibPath, string outputPath)
    {
        ITypeLib typeLib;
        LoadTypeLibEx(typeLibPath, 2 /* REGKIND_NONE */, out typeLib);
        var builder = new TypeLibConverter().ConvertTypeLibToAssembly(
            typeLib, outputPath, TypeLibImporterFlags.None, new M3TypeLibSink(),
            null, null, "Interop.UIAutomationClient", null);
        builder.Save(System.IO.Path.GetFileName(outputPath));
    }
}
'@
    # Generated under its final file name (which .NET ties to the assembly's
    # identity) in a folder of its own, then moved into place, so two M³
    # windows starting at once can't see a half-written file.
    $staging = Join-Path $CacheDir "staging-$PID"
    New-Item -ItemType Directory -Force $staging | Out-Null
    # AssemblyBuilder.Save writes to the current directory.
    Push-Location $staging
    try {
      [M3TypeLibConverter]::Convert($core, (Join-Path $staging (Split-Path $interop -Leaf)))
    } finally {
      Pop-Location
    }
    # Another M³ window may have generated it meanwhile; either copy works.
    Move-Item -Force (Join-Path $staging (Split-Path $interop -Leaf)) $interop -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
    if (-not (Test-Path $interop)) { throw "Could not save $interop" }
  }

  [Reflection.Assembly]::LoadFrom($interop) | Out-Null
  Add-Type -Path (Join-Path $PSScriptRoot 'ZoomHelper.cs') `
    -ReferencedAssemblies $interop, 'System.Web.Extensions', 'WindowsBase'
} catch {
  Write-StartupFailure 'helper-not-compiled' "$_"
  exit 1
}

[M3.ZoomHelper.Program]::Run()
