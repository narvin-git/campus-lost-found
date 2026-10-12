# Captures local machine specs for Appendix D.
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts\specs.ps1

$out = Join-Path $PSScriptRoot "..\results\local_specs.txt"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null

$cpu  = Get-CimInstance Win32_Processor
$cs   = Get-CimInstance Win32_ComputerSystem
$os   = Get-CimInstance Win32_OperatingSystem
$ram  = Get-CimInstance Win32_PhysicalMemory
$disk = Get-PhysicalDisk
$vol  = Get-Volume | Where-Object DriveLetter

$report = @"
LOCAL MACHINE SPECIFICATIONS
Captured: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

== CPU ==
Model:            $($cpu.Name.Trim())
Physical cores:   $(($cpu | Measure-Object NumberOfCores -Sum).Sum)
Logical threads:  $(($cpu | Measure-Object NumberOfLogicalProcessors -Sum).Sum)
Base clock:       $($cpu[0].MaxClockSpeed) MHz

== Memory ==
Total RAM:        $([math]::Round($cs.TotalPhysicalMemory / 1GB, 1)) GB
Modules:
$(($ram | ForEach-Object { "  {0} GB @ {1} MHz ({2})" -f [math]::Round($_.Capacity / 1GB), $_.Speed, $_.Manufacturer }) -join "`n")

== Storage ==
Physical disks:
$(($disk | ForEach-Object { "  {0} | {1} | {2} GB" -f $_.FriendlyName, $_.MediaType, [math]::Round($_.Size / 1GB) }) -join "`n")
Volumes:
$(($vol | ForEach-Object { "  {0}: {1} GB total, {2} GB free" -f $_.DriveLetter, [math]::Round($_.Size / 1GB), [math]::Round($_.SizeRemaining / 1GB) }) -join "`n")

== Operating system ==
OS:               $($os.Caption)
Version / build:  $($os.Version) (build $($os.BuildNumber))
Architecture:     $($os.OSArchitecture)

== Device ==
Manufacturer:     $($cs.Manufacturer)
Model:            $($cs.Model)

== Software stack ==
Node.js:          $(node -v)
MySQL Server:     $((Get-Service | Where-Object Name -like "MySQL*" | Select-Object -First 1 | ForEach-Object { "$($_.Name) ($($_.Status))" }))
Apache (XAMPP):   $(if (Test-Path C:\xampp\apache\bin\httpd.exe) { (& C:\xampp\apache\bin\httpd.exe -v | Select-Object -First 1) } else { "not found" })
"@

$report | Out-File -FilePath $out -Encoding utf8
Write-Host $report
Write-Host "Saved to $out"
