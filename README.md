# Cloud Native — Evaluación Parcial 1 (DSY1107)

Solicitudes de presupuesto con autenticación **OAuth 2.0 / OIDC** (Authorization Code + **PKCE**), **Amazon Cognito**, **API Gateway HTTP**, backend **Spring Boot en ECS Fargate** y frontend **React** en **Amplify**.

Identificador de despliegue: **`grupo-evp1`**.

---

## Qué hace el sistema

| Rol Cognito | Scopes | Puede |
|-------------|--------|--------|
| `trabajadores` | `presupuestos/read`, `presupuestos/write` | Crear, editar, eliminar (si está pendiente) y listar |
| `administradores` | `presupuestos/read`, `presupuestos/decidir` | Listar, aprobar y rechazar |

Sin token → **401**. Token sin el scope de la ruta → **403**.

---

## Arquitectura

```
Usuario
  │
  ▼
SPA React (Vite)  ──login PKCE──►  Cognito Hosted UI
  │                                      │
  │◄──────── code + tokens ──────────────┘
  │                    ▲
  │                    │ Pre Token Generation V2
  │                    │ user-token-ms (grupo → scopes)
  │
  └── /presupuestos + Bearer
        → API Gateway (JWT + scopes)
        → ECS Spring Boot
        → RDS PostgreSQL
```

Infraestructura con **Terraform** en `us-east-1`.

---

## Stack

| Capa | Tecnología |
|------|------------|
| Infra | Terraform + AWS |
| Identidad | Cognito User Pool + Hosted UI + Lambda Pre Token Generation |
| API | API Gateway HTTP + JWT authorizer + scopes |
| Backend | Spring Boot 4 / Java 21 en ECS Fargate |
| Datos | RDS PostgreSQL + Flyway |
| Frontend | React 19, TypeScript, Vite, Tailwind |
| CI/CD | GitHub Actions |

---

## Estructura del repositorio

```
.
├── .github/workflows/     # compile + deploy (front, back, Lambda)
├── backend/               # Spring Boot /presupuestos + Dockerfile
├── frontend/              # SPA React (PKCE + panel de solicitudes)
├── terraform/             # Cognito, API GW, ECS, RDS, Amplify, Lambda
├── user-token-ms/         # Lambda: grupos Cognito → scopes del access token
├── scripts/               # publicar-ecs, config-frontend, publicar-amplify
├── deploy.sh              # config + build + Amplify (o --config-local)
├── sincronizar-github.sh  # outputs Terraform → variables de GitHub
└── REPO.md                # reglas de estructura y secretos del curso
```

---

## Roles y archivos clave

| Qué | Dónde |
|-----|--------|
| Grupos Cognito y cliente SPA | `terraform/cognito.tf` |
| Lambda de scopes | `user-token-ms/index.mjs` + `terraform/lambda.tf` |
| Rutas API + scopes | `terraform/main.tf` |
| Login PKCE | `frontend/src/auth/pkce.ts`, `cognito-auth.ts` |
| Panel CRUD / decisión | `frontend/src/components/presupuestos-panel.tsx` |
| API REST | `backend/.../SolicitudPresupuestoController.java` |

---

## API Gateway

| Ruta | Scope |
|------|--------|
| `GET /presupuestos` | `presupuestos/read` |
| `POST /presupuestos` | `presupuestos/write` |
| `PUT` / `DELETE /presupuestos/{id}` | `presupuestos/write` |
| `POST /presupuestos/{id}/decision` | `presupuestos/decidir` |

---

## Cómo levantarlo

### Requisitos

- AWS CLI con credenciales del **Learner Lab** (Access Key, Secret, Session Token)
- Terraform ≥ 1.5, Docker, Java 21 (o `./mvnw`), Node 20+, `jq`

### 1. Infraestructura

```bash
cd terraform
terraform init
terraform apply -var='crear_ruta_internet=false'   # si el lab ya tiene la ruta IGW
```

### 2. Usuarios Cognito

En la consola AWS → Cognito → user pool `dsy1107-grupo-evp1`:

1. Crear usuarios
2. Asignarlos a **`trabajadores`** o **`administradores`**

Sin grupo, el login funciona pero el API no tendrá scopes útiles.

### 3. Backend (ECS)

```bash
chmod +x backend/mvnw scripts/*.sh deploy.sh sincronizar-github.sh
./scripts/publicar-ecs.sh
```

Compila el jar, sube la imagen a ECR, despliega en Fargate y reapunta las integraciones del API Gateway a la IP de la task.

### 4. Frontend

**Local:**

```bash
./deploy.sh --config-local
cd frontend && npm install && npm run dev
# → http://localhost:5173/
```

**Amplify (público):**

```bash
./deploy.sh
```

> `./deploy.sh` escribe `config.json` con la URL de Amplify.  
> Para volver a local: `./deploy.sh --config-local`.

---

## GitHub Actions

| Workflow | Qué hace |
|----------|----------|
| `frontend_compile.yml` / `backend_compile.yml` | Build en push |
| `frontend_deploy.yml` | Publica en Amplify |
| `backend_deploy.yml` | Imagen → ECR → ECS + reapunte API GW |
| `user_token_ms_deploy.yml` | Actualiza código de la Lambda |

Tras `terraform apply`:

```bash
./sincronizar-github.sh
```

Configura en GitHub (**Settings → Secrets and variables → Actions**) los secretos temporales del lab:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

Se vencen al cerrar la sesión del Learner Lab: hay que actualizarlos cada vez.

Detalle de estructura y pipelines: ver [`REPO.md`](REPO.md).

---

## Comandos útiles

```bash
# Outputs
terraform -chdir=terraform output
terraform -chdir=terraform output -raw url_presupuestos

# Probar API sin token (debe ser 401)
curl -s -o /dev/null -w '%{http_code}\n' \
  "$(terraform -chdir=terraform output -raw url_presupuestos)"

# Logs backend
aws logs tail /ecs/dsy1107-backend-grupo-evp1 --follow

# Logs Lambda scopes
aws logs tail /aws/lambda/user-token-ms-grupo-evp1 --follow
```

---

## Curso

**DSY1107** · EA1 / EVP1 · Cognito PKCE · Amplify · ECS · presupuestos + scopes · `grupo-evp1`
