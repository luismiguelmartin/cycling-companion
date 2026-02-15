export const WEATHER_TYPES = {
  sunny: { value: "sunny", label: "Soleado", icon: "Sun" },
  cloudy: { value: "cloudy", label: "Nublado", icon: "Cloud" },
  rainy: { value: "rainy", label: "Lluvioso", icon: "CloudRain" },
  windy: { value: "windy", label: "Ventoso", icon: "Wind" },
  cold: { value: "cold", label: "Frío", icon: "Snowflake" },
} as const;

export type WeatherTypeKey = keyof typeof WEATHER_TYPES;

export type WeatherType = (typeof WEATHER_TYPES)[WeatherTypeKey];
