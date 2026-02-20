export interface DemoScreen {
  id: string;
  title: string;
  description: string;
}

export const DEMO_SCREENS: DemoScreen[] = [
  {
    id: "onboarding-0",
    title: "Onboarding — Datos básicos",
    description:
      "El primer paso: nombre, edad y peso. Con estos datos personalizamos toda tu experiencia de entrenamiento.",
  },
  {
    id: "onboarding-1",
    title: "Onboarding — Rendimiento",
    description:
      "FTP, frecuencia cardíaca máxima y en reposo. Si no los conoces, la IA los estimará a partir de tus actividades.",
  },
  {
    id: "onboarding-2",
    title: "Onboarding — Objetivo",
    description:
      "Elige tu objetivo: rendimiento, salud, perder peso o recuperación. El plan de entrenamiento se adapta a él.",
  },
  {
    id: "onboarding-3",
    title: "Onboarding — Resumen",
    description:
      "Resumen de tu perfil y bienvenida de tu entrenador IA personal. Todo listo para empezar a entrenar.",
  },
  {
    id: "dashboard",
    title: "Dashboard",
    description:
      "Vista general de tu semana: KPIs de distancia, tiempo, potencia y FC, gráficas de tendencia y recomendación del coach IA.",
  },
  {
    id: "activities",
    title: "Actividades",
    description:
      "Historial completo de sesiones con búsqueda y filtros por tipo. Importa desde archivo FIT/GPX o registra manualmente.",
  },
  {
    id: "plan",
    title: "Planificación semanal",
    description:
      "Plan generado por IA con detalle diario: tipo, intensidad, duración, nutrición y descanso. Se adapta a tu progresión.",
  },
  {
    id: "insights",
    title: "Comparar periodos",
    description:
      "Compara dos semanas con métricas detalladas, radar de rendimiento y análisis IA de tu evolución.",
  },
  {
    id: "profile",
    title: "Perfil",
    description:
      "Tu perfil completo con zonas de potencia y frecuencia cardíaca calculadas automáticamente.",
  },
];
