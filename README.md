# OS Service (Serviço de Ordens de Serviço)

Microsserviço responsável pelo gerenciamento do ciclo de vida das Ordens de Serviço (OS), incluindo criação, aceitação, execução, finalização e entrega. Também gerencia usuários, veículos, diagnósticos e histórico de mudanças de status.

## Módulos

| Módulo | Responsabilidade |
|--------|-----------------|
| **User** | CRUD de usuários (admin, mecânico, cliente) |
| **Vehicle** | CRUD de veículos vinculados a clientes |
| **Diagnosis** | Diagnósticos de veículos antes do orçamento |
| **Service Order** | Ciclo de vida completo da OS |
| **Service Order History** | Histórico de mudanças de status (MongoDB) |
| **Auth** | Autenticação JWT e autorização por roles |

## Tecnologias

- Node.js 22 + TypeScript
- Express 4
- MySQL (mysql2) — dados transacionais
- MongoDB — histórico de OS
- AWS SQS — mensageria assíncrona
- JWT — autenticação
- Zod — validação
- Jest — testes
- Docker + Kubernetes

## Eventos Publicados (SQS)

| Evento | Quando |
|--------|--------|
| `OS_CREATED` | Nova OS criada |
| `OS_ACCEPTED` | Mecânico aceita a OS |
| `OS_BUDGET_APPROVED` | Cliente aprova orçamento |
| `OS_BUDGET_REJECTED` | Cliente rejeita orçamento |

## Eventos Consumidos (SQS)

| Evento | Ação |
|--------|------|
| `BUDGET_CREATED` | Vincula budgetId à OS |
| `BUDGET_APPROVED` | Atualiza status para AGUARDANDO_INICIO |
| `EXECUTION_COMPLETED` | Atualiza status para FINALIZADA |

## Setup Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais locais

# Rodar migrations (MySQL)
# Executar o conteúdo de src/infra/db/schema.sql no banco

# Rodar em desenvolvimento
npm run dev

# Rodar testes
npm test

# Build para produção
npm run build
npm start
```

## API Endpoints

### Auth
- `POST /auth/login` — Login (retorna JWT)

### Users
- `POST /users` — Criar usuário
- `GET /users` — Listar usuários (admin)
- `GET /users/profile` — Perfil do usuário logado
- `GET /users/:id` — Buscar usuário por ID (admin)
- `PUT /users` — Atualizar dados do usuário logado
- `DELETE /users` — Deletar conta do usuário logado

### Vehicles
- `POST /vehicles` — Criar veículo
- `GET /vehicles` — Listar veículos
- `GET /vehicles/:id` — Buscar veículo por ID
- `PUT /vehicles/:id` — Atualizar veículo
- `DELETE /vehicles/:id` — Deletar veículo

### Diagnoses
- `POST /diagnoses` — Criar diagnóstico (admin)
- `GET /diagnoses` — Listar diagnósticos (admin)
- `GET /diagnoses/:id` — Buscar diagnóstico por ID (admin)
- `PUT /diagnoses/:id` — Atualizar diagnóstico (admin)
- `DELETE /diagnoses/:id` — Deletar diagnóstico (admin)

### Service Orders
- `POST /service-orders` — Criar OS
- `GET /service-orders/:id` — Buscar OS por ID
- `DELETE /service-orders/:id` — Deletar OS (admin)
- `POST /service-orders/:id/accept` — Aceitar/recusar OS (admin)
- `POST /service-orders/:id/start` — Iniciar reparo (admin)
- `POST /service-orders/:id/finish` — Finalizar reparo (admin)
- `POST /service-orders/:id/delivered` — Confirmar entrega
- `POST /service-orders/:id/accept-budget` — Aprovar/rejeitar orçamento
- `GET /service-orders/:id/execution-time` — Tempo de execução (admin)
- `GET /service-orders/execution-time/average` — Tempo médio (admin)

### Service Order History
- `POST /service-order-history` — Registrar mudança de status (admin)
- `GET /service-order-history/:idServiceOrder` — Listar histórico (admin)

## Deploy (Kubernetes)

```bash
kubectl apply -f k8s/
```

## Estrutura

```
src/
├── server.ts
├── infra/
│   ├── db/          # MySQL connection + schema
│   ├── mongo/       # MongoDB connection
│   ├── messaging/   # SQS Publisher/Consumer
│   └── resilience/  # Circuit Breaker
├── modules/
│   ├── auth/
│   ├── user/
│   ├── vehicle/
│   ├── diagnosis/
│   ├── service-order/
│   └── service-order-history/
├── shared/
│   ├── events/      # Event types
│   ├── http/        # Controller, HttpError, pagination
│   ├── mail/        # Email service
│   ├── domain/      # Base repository
│   └── application/ # ServerException
└── utils/
    └── logger.ts
```
