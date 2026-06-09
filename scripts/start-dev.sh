#!/bin/bash
set -e

echo "🚀 RickChat Development Environment"
echo "===================================="

# Check prerequisites
command -v java &> /dev/null || { echo "Java 21+ required"; exit 1; }
command -v docker &> /dev/null || { echo "Docker required"; exit 1; }

echo "📦 Starting infrastructure..."
docker compose up -d postgres redis qdrant
echo "✅ Infrastructure ready"

echo "📊 Running database migrations..."
./gradlew :core:flywayMigrate --no-daemon -q
echo "✅ Migrations complete"

echo "🌐 Starting API Gateway on :8080..."
./gradlew :api-gateway:run --no-daemon &
echo "✅ API Gateway started"

echo "🔐 Starting Auth Service on :8081..."
./gradlew :auth-service:run --no-daemon -Dktor.deployment.port=8081 &

echo "👤 Starting User Service on :8082..."
./gradlew :user-service:run --no-daemon -Dktor.deployment.port=8082 &

echo "💬 Starting Chat Service on :8083..."
./gradlew :chat-service:run --no-daemon -Dktor.deployment.port=8083 &

echo "🤖 Starting AI Gateway on :8084..."
./gradlew :ai-gateway:run --no-daemon -Dktor.deployment.port=8084 &

echo "🧠 Starting Memory Service on :8085..."
./gradlew :memory-service:run --no-daemon -Dktor.deployment.port=8085 &

echo ""
echo "✅ All services starting. Press Ctrl+C to stop."
wait
