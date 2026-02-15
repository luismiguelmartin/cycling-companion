# Próximos pasos del TFM

El producto y el pipeline AI-first están **100% implementados**. Lo que queda es el cierre académico.

## 1. Evaluación cuantitativa del pipeline

- Recopilar métricas de GitHub: timestamps issue→PR, nº de turns, costos por agente
- Comparar PRs generadas por IA (R2) vs PRs manuales (misma feature)
- Medir calidad de reviews IA (R3) vs lo que harías tú
- Datos disponibles: Issues #9-#18, PRs #11-#18, costos del pipeline ($0.38/issue)

## 2. Memoria del TFM — Secciones pendientes

- **Metodología**: Describir el pipeline AI-first (agentes locales L1-L4 + remotos R1-R5), justificar decisiones (Haiku vs Sonnet, `claude-code-action@v1`)
- **Resultados**: Tablas con métricas reales, análisis de costos, tiempos de ejecución
- **Limitaciones**: Billing errors enmascarados como AJV, restricciones de `/tmp/`, `--allowedTools` obligatorio, dependencia de créditos API
- **Conclusiones**: Viabilidad del pipeline AI-first para desarrollo individual, relación coste/beneficio
- **Trabajo futuro**: R6 Migration Manager, integración Strava, agentes más complejos

## 3. Demo/presentación

- Preparar un flujo en vivo o grabado: crear issue → `ai-analyze` → `ai-generate-pr` → review → merge → CHANGELOG auto
- Screenshots de cada paso del pipeline (ya disponibles de Issue #17 → PR #18)

## 4. Limpieza final del repo

- Verificar CI en verde tras el push
- Revisar que no haya `.env`, credentials o ficheros temporales
- Confirmar que el deploy en producción (Vercel + Render) sigue funcional

---

**Resumen**: El código está terminado. El foco ahora es **escribir la memoria** (evaluación + conclusiones) y **preparar la defensa**.
