# Cycling Companion — Visión del Producto

## 1. Resumen ejecutivo

**Cycling Companion** es una plataforma web de análisis y planificación de entrenamiento dirigida a ciclistas amateur de 40 años en adelante. Su propuesta de valor se centra en tres pilares: recomendaciones personalizadas impulsadas por IA, análisis claro y accionable de datos de rendimiento, y planificación semanal inteligente.

A diferencia de Strava o Garmin Connect, Cycling Companion no intenta ser una red social ni un visor de mapas. Se enfoca en lo que estas plataformas no resuelven bien: **decirte qué hacer con tus datos**, no solo mostrártelos.

El producto actúa además como **banco de pruebas real** para una metodología de desarrollo basada en un pipeline AI-first integrado en el ciclo de vida del software.

---

## 2. Problema

Los ciclistas amateur de 40+ se enfrentan a un conjunto de problemas recurrentes cuando intentan mejorar su rendimiento o simplemente cuidar su salud:

### 2.1 Exceso de métricas sin recomendaciones útiles

Strava y Garmin Connect ofrecen decenas de métricas (potencia, FC, cadencia, TSS, IF, etc.), pero rara vez traducen esos datos en acciones concretas. El usuario ve números, pero no sabe **qué hacer** con ellos.

### 2.2 Planificación semanal inexistente o genérica

Ninguna de las plataformas populares genera un plan semanal adaptado al estado actual del ciclista. Los planes que existen son estáticos, genéricos y no reaccionan a la fatiga acumulada ni a la vida real (trabajo, sueño, estrés).

### 2.3 Comparaciones pobres entre periodos

Comparar la semana actual con la anterior, o este mes con el pasado, requiere esfuerzo manual. No hay insights automáticos que digan "esta semana has bajado un 12% de potencia media, probablemente necesites descanso".

### 2.4 Sobrecarga visual y cognitiva

Las apps existentes son abrumadoras. Demasiados gráficos, demasiadas pantallas, demasiadas opciones. Un ciclista amateur no necesita (ni quiere) la complejidad de un entrenador profesional con TrainingPeaks.

### 2.5 Ausencia de guía integral

No basta con decir "hoy toca intervalos". Un ciclista de 40+ necesita recomendaciones de **nutrición básica**, **descanso** y **recuperación** integradas en su planificación, no en apps separadas.

---

## 3. Usuarios objetivo

### 3.1 Persona principal: Ciclista amateur 40–55

- Practica ciclismo 3-5 días por semana
- Usa potenciómetro y/o pulsómetro
- Tiene dispositivo Garmin o usa Strava
- Quiere mejorar sin lesionarse
- No busca una red social, busca un entrenador accesible
- Valora la claridad sobre la cantidad de datos
- Tiene responsabilidades (trabajo, familia) que condicionan su disponibilidad

### 3.2 Persona secundaria (fuera del MVP): Entrenador / Asesor

- Revisa datos del atleta
- Da feedback y ajusta planes
- Se contempla como feature futura, no en el MVP

---

## 4. Propuesta de valor

> "Tu entrenador IA personal que entiende tus datos, respeta tu cuerpo y te dice exactamente qué hacer esta semana."

Cycling Companion se diferencia por:

| Aspecto                             | Strava        | Garmin Connect | Cycling Companion                         |
| ----------------------------------- | ------------- | -------------- | ----------------------------------------- |
| Trazado de rutas                    | ✅            | ✅             | ❌ (fuera de MVP)                         |
| Mapas                               | ✅            | ✅             | ❌ (fuera de MVP)                         |
| Potencia + FC                       | ✅            | ✅             | ✅                                        |
| Planificación semanal inteligente   | ❌            | ❌             | ✅ (IA-driven)                            |
| Análisis de tendencias simplificado | ✅ (complejo) | ✅ (complejo)  | ✅ (claro y accionable)                   |
| Recomendaciones personalizadas      | Limitado      | Limitado       | ✅ (entrenamiento + nutrición + descanso) |
| Social / segmentos                  | ✅            | ❌             | ❌                                        |
| Entrenador IA integrado             | ❌            | ❌             | ✅                                        |

---

## 5. Funcionalidades del MVP

### 5.1 Dashboard principal

Vista rápida del estado de entrenamiento del ciclista:

- **Resumen semanal/mensual**: distancia total, tiempo total, potencia media, FC media
- **Gráfica de tendencia** (últimas 4 semanas): potencia vs esfuerzo percibido
- **Tarjeta de recomendación IA**: texto breve con sugerencias actuales (entrenamiento, descanso, nutrición)
- **Accesos rápidos**: ver última actividad, plan semanal, comparar semanas
- **Navegación lateral**: Inicio, Actividades, Planificación, Insights, Perfil

### 5.2 Lista de actividades

- Tabla con columnas: fecha, tipo de salida, distancia, tiempo, potencia media, FC media
- Filtros por rango de fechas y tipo
- Búsqueda por nombre/notas
- Botón "Importar actividad" (carga de archivo .fit/.gpx o datos mock)

### 5.3 Detalle de una actividad

- Indicadores principales: distancia, tiempo, potencia media, FC media, cadencia media
- Gráficas temporales: potencia/tiempo, FC/tiempo, cadencia/tiempo
- **Análisis IA de la sesión**: qué indica este entreno, qué deberías priorizar a continuación
- Añadir notas personales
- Marcar como "sesión de referencia"

### 5.4 Planificación semanal

- Vista calendario (semana)
- Objetivos semanales configurables
- **Sugerencias IA por día**: tipo de entreno, intensidad estimada, duración
- **Recomendaciones complementarias**: hidratación, nutrición pre/post, horas de sueño sugeridas
- Botón "Recalcular plan" (regenera basándose en actividades recientes)
- Colores por tipo de entreno (intervalos, resistencia, tempo, recuperación, descanso)
- Indicadores visuales de carga acumulada

### 5.5 Comparar semanas / tendencias

- Selección de dos periodos para comparar
- Datos comparativos: tiempo, distancia, potencia, FC, carga
- Gráficas comparativas lado a lado
- **Resumen IA**: texto que explica qué cambió y por qué importa

### 5.6 Perfil y ajustes

- Datos del usuario: edad, peso, FTP, FC máxima, FC en reposo
- Zonas de potencia y FC (calculadas automáticamente o personalizables)
- Objetivo actual (mejorar rendimiento, mantener forma, perder peso, recuperarse de lesión)
- Preferencias de notificaciones
- Conexión con dispositivo (placeholder en MVP: importación manual de archivos)

### 5.7 Entrenador IA (feature transversal)

No es una pantalla, sino una capa que opera en toda la app:

- **En el dashboard**: resumen y recomendación del día
- **En cada actividad**: análisis post-sesión
- **En la planificación**: generación y ajuste de plan semanal
- **En comparativas**: explicación de tendencias
- **Tono**: cercano, motivador, basado en datos. Como un entrenador experimentado que te conoce.

Internamente se implementa como:

- LLM (Claude) como capa explicativa
- Reglas + heurísticas para lógica de entrenamiento (no depender solo del LLM)
- Datos del usuario como contexto (RAG simplificado)

---

## 6. Mejoras propuestas sobre la idea original

Manteniendo el espíritu MVP, se proponen las siguientes mejoras leves:

### 6.1 Recomendaciones de nutrición y descanso

La idea original se centraba en entrenamiento. Se añade una capa ligera de recomendaciones de nutrición básica (hidratación, carbohidratos pre/post) y descanso (horas de sueño sugeridas, días de recuperación activa). No es una app de nutrición, son **píldoras contextuales**.

### 6.2 Esfuerzo percibido (RPE) como input del usuario

Después de cada actividad, el usuario puede indicar su esfuerzo percibido (escala 1-10). Esto alimenta las recomendaciones de la IA y permite cruzar datos objetivos (potencia, FC) con la percepción subjetiva.

### 6.3 Alertas de sobrecarga

Si la carga semanal acumulada supera umbrales configurables (basados en TSS o similar simplificado), el sistema muestra alertas visuales y sugiere descanso. Es una feature de alto valor con implementación simple (reglas + umbrales).

### 6.4 Onboarding guiado

Primera experiencia del usuario: un flujo de 3-4 pasos que recoge datos básicos (edad, peso, FTP, objetivo) y explica cómo funciona la app. Esto mejora la retención y da contexto a la IA desde el primer momento.

### 6.5 Exportación de plan semanal

Permitir exportar el plan semanal como imagen o PDF para compartir con un entrenador externo o simplemente tenerlo offline. Feature sencilla pero de alto valor percibido.

---

## 7. Fuera del MVP (backlog futuro)

- Integración directa con APIs de Strava / Garmin Connect
- Rol de entrenador con vista multi-atleta
- Mapas y trazado de rutas
- Social: compartir logros
- Sincronización automática de actividades
- App móvil nativa
- Gamificación (rachas, badges)
- Integración con wearables para datos de sueño/recuperación

---

## 8. Métricas de éxito del MVP

- El usuario puede cargar actividades y ver sus datos claramente
- El plan semanal generado por IA es coherente con los datos del usuario
- Las recomendaciones son comprensibles y accionables
- El flujo completo (importar → ver → planificar → comparar) funciona sin errores
- El sistema es usable en escritorio y razonablemente responsive en móvil

---

## 9. Rol del producto dentro del pipeline AI-first

Cycling Companion **no es el objetivo principal**, sino el banco de pruebas del pipeline AI-first. El producto existe para:

- Generar issues, PRs y bugs reales sobre los que opera el pipeline AI-first
- Demostrar que la arquitectura multi-agente funciona en un contexto real
- Medir el impacto de la IA en el ciclo de desarrollo mediante métricas objetivas
- Proporcionar un demo tangible de la metodología de desarrollo

El protagonista es el **pipeline AI-first**. El producto es el terreno donde se demuestra.
