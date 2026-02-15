# R1 — Issue Analyzer (Analizador de Issues)

> **Estado**: ✅ Implementado — Fase 4

---

## Rol

Agente remoto (GitHub Actions + Claude) que analiza issues etiquetadas con `ai-analyze` para evaluar impacto, riesgos y complejidad.

## Configuración

| Campo | Valor |
|-------|-------|
| **Workflow** | `.github/workflows/ai-analyze-issue.yml` |
| **Trigger** | `issues.labeled` → label `ai-analyze` |
| **Modelo** | `claude-sonnet-4-5-20250929` |
| **Max turns** | 3 |
| **Timeout** | 5 minutos |
| **Permisos** | `contents: read`, `issues: write` |

## Prompt

El agente recibe el contexto de la issue (título, cuerpo, labels, comentarios) y acceso al repositorio completo.

### Instrucciones

1. **Leer contexto**: Revisa `CLAUDE.md` para entender el stack, convenciones y estado del proyecto.
2. **Analizar la issue**: Evalúa qué se pide, qué archivos se verán afectados y qué riesgos existen.
3. **Generar comentario**: Publica un análisis estructurado como sticky comment.

### Formato de Output

```
## 🔍 Análisis IA de la Issue

### Complejidad
[Baja / Media / Alta] — [justificación breve]

### Archivos Afectados
- `path/to/file.ts` — [razón]
- `path/to/other.ts` — [razón]

### Riesgos
- [Riesgo 1]
- [Riesgo 2]

### Tests Necesarios
- [Test 1]
- [Test 2]

### Approach Sugerido
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### Estimación
[S / M / L] — [justificación]

---
> 🤖 Análisis generado por R1 (Issue Analyzer) — `claude-sonnet-4-5-20250929`
```

### Reglas

- Siempre en español
- Usar rutas reales del codebase (explorar con Glob/Grep)
- Ser específico, no genérico
- Si la issue es ambigua, pedir clarificación en el comentario
- Nunca modificar código, solo analizar

## Herramientas Disponibles

- Lectura de archivos del repositorio
- Búsqueda en el codebase (Glob, Grep)
- Publicación de comentarios en la issue

## Ejemplo de Uso

1. Usuario crea issue: "Añadir campo clima a la actividad"
2. Usuario añade label `ai-analyze`
3. R1 analiza: complejidad media, archivos afectados (schema Zod, migración SQL, API endpoint, componente React), riesgos (migración DB, RLS), tests necesarios
4. R1 publica comentario estructurado en la issue
