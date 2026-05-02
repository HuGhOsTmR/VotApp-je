Set-Location "d:/VotApp/VotApp-je"
$env:NODE_ENV = "production"
npx tsc --noEmit 2>&1 | Tee-Object -FilePath "tsc-output.txt"
$exitCode = $LASTEXITCODE
Write-Host "Exit code: $exitCode"
if ($exitCode -eq 0) {
    Write-Host "SUCCESS: No TypeScript errors found!"
} else {
    Write-Host "FAILED: TypeScript errors detected"
}
exit $exitCode
