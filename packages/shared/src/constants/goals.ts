export const GOALS = [
  {
    key: "performance" as const,
    icon: "Target",
    label: "Mejorar rendimiento",
    description: "Subir FTP, más potencia en competición o marchas",
  },
  {
    key: "health" as const,
    icon: "Heart",
    label: "Mantener salud",
    description: "Entrenar de forma sostenible y equilibrada",
  },
  {
    key: "weight_loss" as const,
    icon: "TrendingDown",
    label: "Perder peso",
    description: "Quemar grasa manteniendo masa muscular",
  },
  {
    key: "recovery" as const,
    icon: "Shield",
    label: "Recuperación",
    description: "Volver de una lesión o pausa prolongada",
  },
] as const;

export const ONBOARDING_STEPS = [
  {
    title: "¿Quién eres?",
    subtitle: "Datos básicos para personalizar tu experiencia",
    iconName: "User" as const,
  },
  {
    title: "Tu rendimiento",
    subtitle: "Nos ayuda a calcular tus zonas de entrenamiento",
    iconName: "Heart" as const,
  },
  {
    title: "Tu objetivo",
    subtitle: "¿Qué quieres conseguir con Cycling Companion?",
    iconName: "Target" as const,
  },
  {
    title: "¡Listo!",
    subtitle: "Tu entrenador IA está preparado",
    iconName: "Check" as const,
  },
] as const;
