# .env 의 값을 Railway Variables 로 올립니다. (값은 화면에 출력하지 않아요)
# 사용: railway login / init / add 이후, my_api 폴더에서  .\set_railway_vars.ps1
Set-Location $PSScriptRoot
$names = "SUPABASE_URL","SUPABASE_SECRET_KEY","FRONT_ORIGINS"
foreach ($line in Get-Content .env -Encoding UTF8) {
  if ($line -match '^\s*([A-Z_]+)\s*=\s*(.+?)\s*$' -and $names -contains $Matches[1]) {
    railway variables --set "$($Matches[1])=$($Matches[2])" --skip-deploys | Out-Null
    Write-Host "올림: $($Matches[1])"
  }
}
