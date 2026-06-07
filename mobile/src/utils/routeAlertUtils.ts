import { Alert, Vibration } from "react-native";

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface Camion {
  id: string;
  ownerId: string;
  ficha: string;
  marca: string;
  modelo: string;
  año: number;
  kilometraje: string;
  estado: "En Ruta" | "Mantenimiento" | "Disponible";
  latitud: number;
  longitud: number;
  velocidad: number;
  fechaVencimientoSeguro: string;
}

export interface AlertaRuta {
  id: string;
  camion: Camion;
  mensaje: string;
  telefonoPropietario: string;
  coordenadas: Coordenada;
  direccion: string;
  carretera: string;
  fecha: string;
}

export interface AlertaVelocidad {
  id: string;
  camion: Camion;
  mensaje: string;
  telefonoPropietario: string;
  velocidadActual: number;
  coordenadas: Coordenada;
  fecha: string;
}

export interface AlertaSeguro {
  id: string;
  camion: Camion;
  mensaje: string;
  telefonoPropietario: string;
  diasParaVencer: number;
  fecha: string;
}

const rutaPermitida: Coordenada[] = [
  { latitude: 18.4160, longitude: -70.0320 },
  { latitude: 18.4200, longitude: -70.0300 },
  { latitude: 18.4240, longitude: -70.0250 },
];

const METROS_MAX_DESVIO = 450; // Máximo permitido desde la ruta por defecto

export const datosCamiones: Camion[] = [
  {
    id: "1",
    ownerId: "owner-1",
    ficha: "F-01",
    marca: "Mack",
    modelo: "Pinnacle MP7",
    año: 2011,
    kilometraje: "450,000 km",
    estado: "En Ruta",
    latitud: 18.4200,
    longitud: -70.0300,
    velocidad: 92,
    fechaVencimientoSeguro: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split("T")[0],
  },
  {
    id: "2",
    ownerId: "owner-1",
    ficha: "F-02",
    marca: "Freightliner",
    modelo: "Cascadia",
    año: 2015,
    kilometraje: "520,000 km",
    estado: "Mantenimiento",
    latitud: 18.4350,
    longitud: -69.9950,
    velocidad: 0,
    fechaVencimientoSeguro: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
  },
  {
    id: "3",
    ownerId: "owner-2",
    ficha: "F-03",
    marca: "International",
    modelo: "ProStar",
    año: 2014,
    kilometraje: "380,000 km",
    estado: "Disponible",
    latitud: 18.4180,
    longitud: -70.0150,
    velocidad: 72,
    fechaVencimientoSeguro: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split("T")[0],
  },
  {
    id: "4",
    ownerId: "owner-2",
    ficha: "F-04",
    marca: "Kenworth",
    modelo: "T680",
    año: 2018,
    kilometraje: "280,000 km",
    estado: "En Ruta",
    latitud: 18.4280,
    longitud: -70.0280,
    velocidad: 78,
    fechaVencimientoSeguro: new Date(new Date().setDate(new Date().getDate() + 8)).toISOString().split("T")[0],
  },
  {
    id: "5",
    ownerId: "owner-3",
    ficha: "F-05",
    marca: "Volvo",
    modelo: "VNL 760",
    año: 2017,
    kilometraje: "360,000 km",
    estado: "Disponible",
    latitud: 18.4125,
    longitud: -70.0225,
    velocidad: 45,
    fechaVencimientoSeguro: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split("T")[0],
  },
];

const camionesPorOwnerId: Record<string, string[]> = datosCamiones.reduce((acc, camion) => {
  if (!acc[camion.ownerId]) acc[camion.ownerId] = [];
  acc[camion.ownerId].push(camion.id);
  return acc;
}, {} as Record<string, string[]>);

const camionPorId = new Map(datosCamiones.map((camion) => [camion.id, camion]));

export function filtrarCamionesPorOwnerId(ownerId: string) {
  const ids = camionesPorOwnerId[ownerId] || [];
  return ids.map((id) => camionPorId.get(id)).filter((camion): camion is Camion => camion !== undefined);
}

export function obtenerCamionesPorPagina(ownerId: string, page = 1, size = 3) {
  const ids = camionesPorOwnerId[ownerId] || [];
  const start = (page - 1) * size;
  return ids.slice(start, start + size).map((id) => camionPorId.get(id)).filter((camion): camion is Camion => camion !== undefined);
}

function haversineDistanceKm(p1: Coordenada, p2: Coordenada) {
  const R = 6371;
  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanciaPuntoASegmento(p: Coordenada, a: Coordenada, b: Coordenada) {
  const vx = b.longitude - a.longitude;
  const vy = b.latitude - a.latitude;
  const wx = p.longitude - a.longitude;
  const wy = p.latitude - a.latitude;
  const c1 = vx * wx + vy * wy;
  if (c1 <= 0) return haversineDistanceKm(p, a);
  const c2 = vx * vx + vy * vy;
  if (c2 <= c1) return haversineDistanceKm(p, b);
  const t = c1 / c2;
  const nearest = {
    latitude: a.latitude + vy * t,
    longitude: a.longitude + vx * t,
  };
  return haversineDistanceKm(p, nearest);
}

function distanciaMinimaARuta(camion: Camion) {
  const puntoCamion = { latitude: camion.latitud, longitude: camion.longitud };
  let distanciaMinima = Infinity;

  for (let i = 0; i < rutaPermitida.length - 1; i += 1) {
    const distanciaSegmento = distanciaPuntoASegmento(
      puntoCamion,
      rutaPermitida[i],
      rutaPermitida[i + 1]
    );
    distanciaMinima = Math.min(distanciaMinima, distanciaSegmento);
  }

  return distanciaMinima * 1000; // metros
}

export function detectarDesvio(camion: Camion): AlertaRuta | null {
  const distancia = distanciaMinimaARuta(camion);

  if (distancia > METROS_MAX_DESVIO) {
    const ubicacion: Coordenada = {
      latitude: camion.latitud,
      longitude: camion.longitud,
    };

    return {
      id: `alerta-${camion.id}`,
      camion,
      mensaje: `Unidad ${camion.ficha} se salió de la ruta permitida.`,
      telefonoPropietario: "+18295581414",
      coordenadas: ubicacion,
      direccion: "Av. Las Américas, cerca del tramo Haina-Puerto",
      carretera: "Autopista Duarte",
      fecha: new Date().toISOString(),
    };
  }

  return null;
}

export function obtenerAlertasFueraDeRuta(camiones: Camion[]) {
  return camiones
    .map(detectarDesvio)
    .filter((alerta): alerta is AlertaRuta => alerta !== null);
}

const VELOCIDAD_MAX_PERMITIDA = 80;

export function detectarExcesoVelocidad(camion: Camion): AlertaVelocidad | null {
  if (camion.velocidad > VELOCIDAD_MAX_PERMITIDA) {
    const ubicacion: Coordenada = {
      latitude: camion.latitud,
      longitude: camion.longitud,
    };

    return {
      id: `velocidad-${camion.id}`,
      camion,
      mensaje: `Unidad ${camion.ficha} circula a ${camion.velocidad} kph y supera los ${VELOCIDAD_MAX_PERMITIDA} kph.`,
      telefonoPropietario: "+18295581414",
      velocidadActual: camion.velocidad,
      coordenadas: ubicacion,
      fecha: new Date().toISOString(),
    };
  }

  return null;
}

export function obtenerAlertasVelocidad(camiones: Camion[]) {
  return camiones
    .map(detectarExcesoVelocidad)
    .filter((alerta): alerta is AlertaVelocidad => alerta !== null);
}

export function simularAlarmaVelocidad(alerta: AlertaVelocidad) {
  const texto = `Alerta enviada a ${alerta.telefonoPropietario}: ${alerta.mensaje}`;
  console.log(texto);
  Vibration.vibrate([0, 400, 150, 400]);
  Alert.alert("Alerta de Velocidad", texto, [{ text: "Ver unidad" }], { cancelable: true });
  return texto;
}

const DIAS_MAX_VENCIMIENTO_SEGURO = 7;

export function detectarVencimientoSeguro(camion: Camion): AlertaSeguro | null {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaVencimiento = new Date(camion.fechaVencimientoSeguro);
  fechaVencimiento.setHours(0, 0, 0, 0);
  const diasFaltantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diasFaltantes <= DIAS_MAX_VENCIMIENTO_SEGURO && diasFaltantes > 0) {
    return {
      id: `seguro-${camion.id}`,
      camion,
      mensaje: `El camión ficha ${camion.ficha} se le vence el seguro en ${diasFaltantes} día${diasFaltantes === 1 ? "" : "s"}.`,
      telefonoPropietario: "+18295581414",
      diasParaVencer: diasFaltantes,
      fecha: new Date().toISOString(),
    };
  }

  return null;
}

export function obtenerAlertasSeguro(camiones: Camion[]) {
  return camiones
    .map(detectarVencimientoSeguro)
    .filter((alerta): alerta is AlertaSeguro => alerta !== null);
}

export function simularAlarmaSeguro(alerta: AlertaSeguro) {
  const texto = `Alerta enviada a ${alerta.telefonoPropietario}: ${alerta.mensaje}`;
  console.log(texto);
  Vibration.vibrate([0, 300, 100, 300, 100, 300]);
  Alert.alert("Alerta de Vencimiento de Seguro", alerta.mensaje, [{ text: "Aceptar" }], { cancelable: true });
  return texto;
}

export function simularEnvioAlarma(alerta: AlertaRuta) {
  const texto = `Alerta enviada a ${alerta.telefonoPropietario}: ${alerta.mensaje} en ${alerta.direccion} (${alerta.carretera})`;
  console.log(texto);
  Alert.alert("Alerta Fuera de Ruta", texto, [{ text: "Aceptar" }], { cancelable: true });
  return texto;
}
