```mermaid
graph TD
    A[Usuario] --> B{¿Tipo de Usuario?}
    B -->|Público| C[Dashboard Público]
    B -->|Parlamentario| D[Login Parlamentario]
    B -->|Admin| E[Login Admin con 2FA]

    %% Flujo Público
    C --> F[Ver Mociones Activas]
    F --> G[Resultados en Tiempo Real]
    G --> H[Exportar CSV]

    %% Flujo Parlamentario
    D --> I[Ver Mociones Abiertas]
    I --> J[Seleccionar Voto]
    J --> K[Confirmar Voto]
    K --> L[Voto Registrado]
    L --> M[Auditoría Automática]

    %% Flujo Admin
    E --> N{¿2FA Activado?}
    N -->|No| O[Acceso Directo]
    N -->|Sí| P[Verificar Código TOTP]
    P --> O

    O --> Q[Panel de Administración]
    Q --> R[Gestionar Usuarios]
    Q --> S[Gestionar Sesiones]
    Q --> T[Gestionar Mociones]
    Q --> U[Gestionar Parlamentarios]
    Q --> V[Ver Auditoría]
    Q --> W[Configurar Perfil/2FA]

    %% Base de Datos
    L --> X[(Supabase PostgreSQL)]
    R --> X
    S --> X
    T --> X
    U --> X
    V --> X
    W --> X

    %% Conexiones de Datos
    X --> G
    X --> I
    X --> F

    %% Estilos
    classDef public fill:#e1f5fe
    classDef parliamentarian fill:#f3e5f5
    classDef admin fill:#e8f5e8
    classDef database fill:#fff3e0

    class C,F,G,H public
    class D,I,J,K,L,M parliamentarian
    class E,N,O,P,Q,R,S,T,U,V,W admin
    class X database
```

## 🏗️ Arquitectura Técnica

```mermaid
graph TB
    subgraph "Frontend (Next.js)"
        A[Pages/Routes]
        B[Components React]
        C[Hooks Personalizados]
        D[Context/Auth]
    end

    subgraph "Backend (API Routes)"
        E[Auth Endpoints]
        F[CRUD Endpoints]
        G[Business Logic]
        H[Validation]
    end

    subgraph "Base de Datos (Supabase)"
        I[(user_profiles)]
        J[(parliamentarians)]
        K[(motions)]
        L[(votes)]
        M[(sessions)]
        N[(audit_logs)]
    end

    subgraph "Servicios Externos"
        O[Supabase Auth]
        P[Supabase Storage]
        Q[Email Service]
    end

    A --> E
    B --> F
    C --> G
    D --> O

    E --> I
    F --> J
    F --> K
    F --> L
    F --> M
    G --> N

    H --> I
    H --> J
    H --> K
    H --> L

    O --> I
    P --> J
    Q --> I
```

## 🔄 Flujo de Votación Detallado

```mermaid
sequenceDiagram
    participant P as Parlamentario
    participant UI as Interfaz de Votación
    participant API as API Backend
    participant DB as Base de Datos
    participant AUDIT as Sistema de Auditoría

    P->>UI: Seleccionar opción de voto
    UI->>UI: Mostrar confirmación
    P->>UI: Confirmar voto
    UI->>API: POST /api/votes
    API->>API: Validar usuario y moción
    API->>DB: Insertar voto
    DB-->>API: Confirmación
    API->>AUDIT: Registrar acción
    API-->>UI: Éxito
    UI->>P: Notificación de éxito
    UI->>UI: Actualizar interfaz

    Note over DB,AUDIT: Voto registrado permanentemente
```

## 🔐 Flujo de Autenticación con 2FA

```mermaid
sequenceDiagram
    participant U as Usuario Admin
    participant L as Login Page
    participant API as API Auth
    participant DB as Database
    participant TOTP as TOTP Service

    U->>L: Ingresar email/contraseña
    L->>API: POST /auth/login
    API->>DB: Verificar credenciales
    DB-->>API: Usuario válido + 2FA enabled
    API-->>L: Requerir 2FA
    L->>U: Mostrar formulario 2FA
    U->>L: Ingresar código TOTP
    L->>API: POST /auth/verify-2fa
    API->>TOTP: Verificar código
    TOTP-->>API: Código válido
    API-->>L: Autenticación completa
    L->>U: Redirigir a /admin
```

## 📊 Flujo de Cálculo de Quórum

```mermaid
flowchart TD
    A[Consulta de Resultados] --> B[Obtener Total Parlamentarios Activos]
    B --> C[Calcular Quórum = MAX(50% + 1, 50)]
    C --> D[Contar Votos Presentes]
    D --> E{¿Votos Presentes >= Quórum?}
    E -->|Sí| F[Quórum Alcanzado ✓]
    E -->|No| G[Quórum No Alcanzado ✗]
    F --> H[Mostrar Resultados Válidos]
    G --> I[Mostrar Advertencia]
    H --> J[Permitir Decisión]
    I --> K[Esperar Más Votos]

    classDef success fill:#d4edda
    classDef warning fill:#f8d7da
    classDef process fill:#cce5ff

    class F,H,J success
    class G,I,K warning
    class A,B,C,D,E process
```