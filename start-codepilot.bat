start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

:waitForDocker
timeout /t 2 > nul
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    ping 127.0.0.1 -n 1 > nul
    goto :waitForDocker
)

rem Stop and remove the running container if it exists
docker stop codepilot > nul 2>&1
docker rm codepilot > nul 2>&1

docker build -t codepilot .
docker run --rm -d -v "%cd%":/app -v "%cd%/..":/src  -p 4000:3000 --name codepilot codepilot


