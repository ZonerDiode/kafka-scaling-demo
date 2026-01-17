Write-Host "=== Stage 1: Starting Kafka Cluster ==="
docker compose up -d kafka1 kafka2 kafka3

Write-Host "Waiting for brokers to become healthy..."
Start-Sleep -Seconds 10

Write-Host "=== Stage 2: Starting Producer Service ==="
docker compose up -d producer

Write-Host "Waiting for producer to initialize..."
Start-Sleep -Seconds 5

Write-Host "=== Stage 3: Starting Consumer Service ==="
docker compose up -d consumer

Write-Host "Waiting for consumer to initialize..."
Start-Sleep -Seconds 5

Write-Host "=== Stage 4: Starting Kafka UI ==="
docker compose up -d kafka-ui

Write-Host "Waiting for Kafka UI to initialize..."
Start-Sleep -Seconds 5

Write-Host "=== All services started ==="
Write-Host "Kafka UI: http://localhost:8080"
Write=Host "Swagger UI: http://localhost:8081/swagger-ui.html"
Write-Host "Use 'docker compose logs -f <service>' to observe behavior."