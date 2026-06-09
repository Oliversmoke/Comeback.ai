# RickChat AI Operating System — Production Backend

Multi-service backend for the RickChat AI Operating System, built with Kotlin, Ktor, PostgreSQL, Redis, Qdrant, and Google Cloud Platform.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway (:8080)                      │
│              Rate Limiting | Auth | Routing | CORS              │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘
       │      │      │      │      │      │      │      │
  ┌────┘ ┌───┘ ┌───┘ ┌───┘ ┌───┘ ┌───┘ ┌───┘ ┌───┘ ┌───┐
  ▼      ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼     ▼
Auth   User  Chat   AI    Mem   Mkt   Learn Trans Notif ...
(8081) (8082) (8083) (8084) (8085) (8086) (8087) (8088) (8092)...

┌─────────────────────────────────────────────────────────────────┐
│                     Shared Infrastructure                        │
│  PostgreSQL  │  Redis  │  Qdrant  │  Firestore  │  GCS          │
└─────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| API Gateway | 8080 | Entry point, rate limiting, auth, routing |
| Auth Service | 8081 | Firebase Auth, OAuth2, JWT, RBAC, password management |
| User Service | 8082 | User CRUD, profiles, preferences, settings |
| Chat Service | 8083 | Real-time chat, WebSockets, messaging, reactions |
| AI Gateway | 8084 | Multi-provider AI routing (OpenAI, Gemini, Anthropic) |
| Memory Service | 8085 | Long-term memory, vector search, semantic retrieval |
| Marketplace | 8086 | Creators, items, reviews, collections, downloads |
| Learning | 8087 | Courses, lessons, quizzes, progress, certificates |
| Translation | 8088 | Text translation, live captions, language support |
| Accessibility | 8089 | TTS, STT, OCR, scene description, accessibility settings |
| Camera AI | 8090 | Object detection, scene analysis, image enhancement |
| Voice AI | 8091 | Voice synthesis, recognition, cloning, voice profiles |
| Notifications | 8092 | Push, email, in-app notifications, device management |
| Payments | 8093 | Payment processing, refunds, revenue sharing |
| Subscriptions | 8094 | Plan management, subscription lifecycle |
| Files | 8095 | File uploads, storage, metadata management |
| Analytics | 8096 | Event tracking, dashboards, daily stats |
| Admin | 8097 | Moderation, user management, system config, audit logs |

## Tech Stack

- **Language**: Kotlin 2.1
- **Framework**: Ktor 3.1
- **Database**: PostgreSQL 17 (with pgvector), Redis 7, Qdrant
- **ORM/Query**: Exposed, Flyway migrations
- **Auth**: Firebase Auth, OAuth2, JWT (access + refresh tokens), RBAC
- **DI**: Koin 4.0
- **Serialization**: kotlinx.serialization, Jackson
- **AI**: OpenAI API, Gemini API, Anthropic API
- **Cloud**: Google Cloud Run, Cloud Functions, Cloud Storage, Secret Manager
- **Monitoring**: Micrometer, OpenTelemetry, Prometheus
- **Messaging**: PubSub (or in-memory)
- **Testing**: JUnit 5, Strikt, MockK, k6, Testcontainers
- **Infrastructure**: Docker, Kubernetes, Kustomize

## Getting Started

### Prerequisites

- JDK 21+
- Docker & Docker Compose
- Gradle 8.12+

### Quick Start

```bash
# Clone and start all services
git clone <repo> rickchat
cd rickchat

# Start infrastructure (PostgreSQL, Redis, Qdrant)
docker compose up -d postgres redis qdrant

# Run migrations
./gradlew :core:flywayMigrate

# Start API Gateway
./gradlew :api-gateway:run

# Start individual services (in separate terminals)
./gradlew :auth-service:run
./gradlew :user-service:run
# ... etc

# Or start everything with Docker Compose
docker compose up -d
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/rickchat` | PostgreSQL connection string |
| `REDIS_HOST` | `localhost` | Redis host |
| `QDRANT_HOST` | `localhost` | Qdrant host |
| `JWT_SECRET` | `...` | JWT signing secret (32+ chars) |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |
| `FIREBASE_PROJECT_ID` | `rickchat` | Firebase project |
| `GOOGLE_CLOUD_PROJECT` | `rickchat` | GCP project |
| `ENVIRONMENT` | `development` | Runtime environment |

## API Documentation

### Authentication Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/oauth/{provider}` | OAuth2 login |
| POST | `/auth/reset-password` | Request password reset |
| POST | `/auth/reset-password/confirm` | Confirm password reset |
| POST | `/auth/change-password` | Change password |

### Chat Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat` | List chats |
| POST | `/chat` | Create chat |
| GET | `/chat/{id}` | Get chat details |
| GET | `/chat/{id}/messages` | Get messages |
| POST | `/chat/{id}/messages` | Send message |
| DELETE | `/chat/{id}/messages/{msgId}` | Delete message |
| POST | `/chat/{chatId}/messages/{msgId}/reactions` | Add reaction |
| WS | `/ws/chat` | WebSocket connection |

### AI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/chat` | Chat completion |
| POST | `/ai/complete` | Text completion |
| POST | `/ai/embed` | Generate embeddings |
| GET | `/ai/models` | List available models |
| GET | `/ai/providers` | Provider status |

### Memory Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/memory` | List memories |
| POST | `/memory` | Create memory |
| GET | `/memory/{id}` | Get memory |
| PUT | `/memory/{id}` | Update memory |
| DELETE | `/memory/{id}` | Delete memory |
| GET | `/memory/search` | Search memories |

### Marketplace Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/marketplace` | List items |
| POST | `/marketplace` | Create item |
| GET | `/marketplace/{id}` | Get item |
| GET | `/marketplace/{id}/reviews` | Get reviews |
| POST | `/marketplace/{id}/reviews` | Create review |
| GET | `/marketplace/{id}/download` | Download item |

### Learning Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/learning/courses` | List courses |
| POST | `/learning/courses` | Create course |
| GET | `/learning/courses/{id}/lessons` | Get lessons |
| POST | `/learning/enrollments` | Enroll in course |
| POST | `/learning/lessons/{id}/submit` | Submit quiz |

### Complete API Reference

See `docs/api-reference.md` for the complete API specification.

## Database Schema

The database includes 40+ tables organized by domain:

- **Users & Auth**: `users`, `user_profiles`, `sessions`, `api_keys`, `oauth2_accounts`, `audit_logs`
- **Chat**: `chats`, `chat_participants`, `messages`, `message_attachments`, `message_reactions`
- **AI**: `ai_conversations`, `memory_entries`, `memory_access_logs`
- **Marketplace**: `marketplace_items`, `marketplace_reviews`, `marketplace_downloads`, `marketplace_collections`
- **Learning**: `courses`, `course_lessons`, `course_quizzes`, `course_enrollments`, `lesson_progress`, `certificates`, `bookmarks`, `flashcards`
- **Payments**: `payment_methods`, `payments`, `payment_items`, `revenue_shares`
- **Subscriptions**: `subscription_plans`, `subscriptions`
- **Files**: `files`
- **Notifications**: `notifications`, `notification_templates`, `notification_devices`
- **Translation**: `translations`, `live_captions`
- **Accessibility**: `accessibility_sessions`, `screen_readers`, `ocr_results`
- **Analytics**: `analytics_events`, `analytics_page_views`, `analytics_daily_stats`
- **Admin**: `admin_actions`, `admin_reports`, `system_config`
- **System**: `background_jobs`

Full schema in `core/src/main/resources/db/migration/V1__Core_Schema.sql`

## Security

- **Authentication**: JWT (access + refresh tokens), Firebase Auth, OAuth2
- **Authorization**: Role-Based Access Control (RBAC) with 6 roles and 25+ permissions
- **Password Security**: bcrypt hashing (cost factor 12)
- **API Security**: Rate limiting, CORS, HSTS, CSRF protection, input validation
- **Data Protection**: SQL injection prevention via parameterized queries, encryption at rest
- **Audit**: Comprehensive audit logging for all administrative actions

## Testing

```bash
# Unit tests
./gradlew test

# Integration tests
./gradlew integrationTest

# Load testing (requires k6)
k6 run load-testing/chat-scenario.js
k6 run load-testing/marketplace-scenario.js

# WebSocket load testing
k6 run load-testing/websocket-test.js
```

## Deployment

### Docker

```bash
# Build all services
docker compose build

# Start full stack
docker compose up -d
```

### Kubernetes

```bash
# Deploy to cluster
kubectl apply -k k8s/overlays/production

# Check status
kubectl get pods -n rickchat
kubectl get services -n rickchat
```

### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/rickchat/api-gateway
gcloud builds submit --tag gcr.io/rickchat/auth-service
# ... for each service

# Deploy
gcloud run deploy api-gateway --image gcr.io/rickchat/api-gateway
```

## Monitoring

- **Metrics**: Prometheus metrics at `/metrics` endpoint
- **Tracing**: OpenTelemetry with OTLP exporter
- **Logging**: Structured JSON logging via Logback, Cloud Logging integration
- **Health**: `/health` endpoint with dependency checks
- **Dashboards**: Cloud Monitoring dashboards

## Project Structure

```
rickchat/
├── core/                          # Shared library
│   └── src/main/kotlin/com/rickchat/core/
│       ├── config/                # App configuration (HOCON)
│       ├── di/                    # Koin modules
│       ├── security/              # JWT, Password, Rate Limiting
│       ├── database/              # PostgreSQL, Redis, Qdrant clients
│       ├── cache/                 # Redis-based caching
│       ├── queue/                 # PubSub / In-memory queue
│       ├── storage/               # GCS file storage
│       ├── monitoring/            # Metrics, Tracing
│       ├── model/                 # Shared DTOs (UserId, Role, ApiResponse)
│       ├── error/                 # Exception hierarchy, error handler
│       ├── logging/               # Structured logger
│       └── util/                  # Validator, IdGenerator
├── api-gateway/                   # Edge proxy (port 8080)
├── auth-service/                  # Auth (port 8081)
├── user-service/                  # Users (port 8082)
├── chat-service/                  # Chat (port 8083)
├── ai-gateway/                    # AI routing (port 8084)
├── memory-service/                # Memory (port 8085)
├── marketplace-service/           # Marketplace (port 8086)
├── learning-service/              # Learning (port 8087)
├── translation-service/           # Translation (port 8088)
├── accessibility-service/         # Accessibility (port 8089)
├── camera-service/                # Camera AI (port 8090)
├── voice-service/                 # Voice AI (port 8091)
├── notification-service/          # Notifications (port 8092)
├── payment-service/               # Payments (port 8093)
├── subscription-service/          # Subscriptions (port 8094)
├── file-service/                  # Files (port 8095)
├── analytics-service/             # Analytics (port 8096)
├── admin-service/                 # Admin (port 8097)
├── k8s/                           # Kubernetes manifests
├── load-testing/                  # k6 load test scripts
├── docs/                          # Documentation
├── docker-compose.yml             # Local development stack
├── Dockerfile                     # API Gateway container
├── Dockerfile.service             # Service container template
├── build.gradle.kts               # Root build
└── settings.gradle.kts            # Multi-module settings
```

## License

RickChat AI Operating System — Internal Use
