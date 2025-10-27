# Summ AI

AI-powered text summarization using Gemini and OpenAI with intelligent fallback.

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd summ-ai

# Configure API keys
cp .env.docker .env
# Edit .env and add your API keys (at least one required)

# Run with Docker
docker-compose up --build

# Access the app
# Frontend: http://localhost:3001
# API: http://localhost:3000
```

## Architecture

### Stack
- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL (Drizzle ORM)
- **Queue**: BullMQ + Redis
- **LLM**: Gemini & OpenAI (fallback pattern)

### Design Patterns

**Adapter Pattern** for LLM providers - abstraction layer allowing seamless switching between AI providers without code changes.

**Queue Pattern** for async processing - BullMQ handles summarization jobs, enabling scalability and reliability.

**Streaming** - Server-Sent Events for real-time summary delivery to the frontend.

### Project Structure

```
summ-ai/
├── apps/
│   ├── api/          # NestJS backend
│   │   ├── src/
│   │   │   ├── features/
│   │   │   │   ├── summarization/  # Core summarization logic
│   │   │   │   ├── llm/             # LLM adapters (Gemini, OpenAI)
│   │   │   │   └── analytics/       # Usage tracking
│   │   │   └── common/              # Shared services
│   │   └── drizzle/                 # Database migrations
│   └── web/          # Next.js frontend
│       ├── app/                     # App router
│       ├── components/              # React components
│       └── lib/                     # API client
└── packages/
    └── typescript-config/           # Shared TS config
```

## Development

```bash
# Install dependencies
pnpm install

# Start services
pnpm dev

# API runs on :3000
# Web runs on :3001
```

## Environment Variables

Required for production:

```env
# At least one AI provider key
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key

# Database (auto-configured in Docker)
DATABASE_URL=postgresql://...

# Redis (auto-configured in Docker)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Assumptions

- Users need at least one LLM provider key (Gemini or OpenAI)
- Text input limited to 50,000 characters
- PostgreSQL and Redis are required dependencies
- Summarizations are processed asynchronously via queues

## Future Improvements

**Performance**
- Implement response caching for repeated texts
- Database read replicas for analytics queries

**Features**
- Multiple summary styles (brief, detailed, bullet points)
- Multi-language support
- Summary history and favorites
- Export to PDF/Markdown
- Batch summarization via file upload

**Observability**
- OpenTelemetry integration
- Structured logging with ELK stack
- Real-time monitoring dashboards
- Error tracking with Sentry

## Scaling Considerations

**Horizontal Scaling**
- Stateless API design allows multiple instances behind load balancer
- Queue workers can scale independently based on job backlog
- Frontend served via CDN with edge caching

**Database**
- Connection pooling configured (default: 10 connections)
- Indexes on frequently queried fields (status, createdAt)

**Security**
- Rate limiting (100 requests/minute per IP)
- API key rotation strategy needed
- CORS configured for allowed origins only
- Input sanitization on all endpoints
- Consider API authentication for production

**Cost Optimization**
- Monitor LLM token usage per provider
- Implement cost alerts at provider level
- Cache frequently summarized content
- Consider cheaper models for shorter texts

---

Built with Next.js, NestJS, Redis, and BullMQ
