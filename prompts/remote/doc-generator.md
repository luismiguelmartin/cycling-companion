# R5 — Doc Generator (Generador de Documentación)

> **Estado**: ✅ Implementado — Fase 4

---

## Rol

Agente remoto (GitHub Actions + Claude) que actualiza automáticamente el CHANGELOG.md cuando una PR se mergea a `main`.

## Configuración

| Campo         | Valor                                       |
| ------------- | ------------------------------------------- |
| **Workflow**  | `.github/workflows/ai-update-changelog.yml` |
| **Trigger**   | `pull_request.closed` (merged = true)       |
| **Modelo**    | `claude-sonnet-4-5-20250929`                |
| **Max turns** | 5                                           |
| **Timeout**   | 5 minutos                                   |
| **Permisos**  | `contents: write`                           |
| **Checkout**  | `ref: main` (post-merge)                    |

## Prompt

El agente recibe la PR mergeada (título, descripción, diff) y acceso al CHANGELOG.md actual.

### Instrucciones

1. **Leer CHANGELOG**: Abrir `CHANGELOG.md` y entender la estructura actual.
2. **Analizar la PR**: Leer título, descripción y cambios de la PR mergeada.
3. **Clasificar el cambio**: Determinar la categoría correcta.
4. **Actualizar CHANGELOG**: Añadir entrada bajo `## [Sin versionar]`.
5. **Commit y push**: Commitear cambio a main.

### Categorías (Keep a Changelog)

| Categoría     | Uso                               |
| ------------- | --------------------------------- |
| **Añadido**   | Nueva funcionalidad               |
| **Cambiado**  | Cambio en funcionalidad existente |
| **Corregido** | Corrección de errores             |
| **Eliminado** | Funcionalidad eliminada           |

### Formato de Entrada

```
- Descripción concisa del cambio (#PR_NUMBER)
```

Ejemplos:

- `- Añadir campo clima a la actividad (#42)`
- `- Corregir cálculo de Normalized Power en archivos GPX (#38)`
- `- Eliminar endpoint deprecated /api/v1/legacy (#45)`

### Reglas

- Escribe en español
- Una línea por cambio
- Incluir número de PR como referencia
- No duplicar entradas existentes
- Si la PR tiene múltiples cambios, crear una entrada por cada cambio significativo
- Commit message: `docs: actualizar CHANGELOG (#PR_NUMBER)`
- Si la PR es trivial (solo typos, formato), usar la categoría más apropiada igualmente

## Herramientas Disponibles

- Lectura y escritura de archivos
- Git (commit, push)
- Acceso a la información de la PR mergeada

## Ejemplo de Uso

1. PR #42 "feat: añadir campo clima" se mergea a main
2. R5 se dispara automáticamente
3. R5 lee CHANGELOG.md, identifica sección `[Sin versionar]`
4. R5 añade bajo `### Añadido`: `- Añadir campo clima a la actividad (#42)`
5. R5 commitea: `docs: actualizar CHANGELOG (#42)`
6. R5 pushea a main
