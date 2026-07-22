import { create } from "zustand";

interface AppState {
  mesActual: number;
  anioActual: number;
  drawerAbierto: boolean;
  setMesActual: (mes: number) => void;
  setAnioActual: (anio: number) => void;
  toggleDrawer: () => void;
  setDrawerAbierto: (abierto: boolean) => void;
}

const hoy = new Date();

export const useAppStore = create<AppState>((set) => ({
  mesActual: hoy.getMonth(),
  anioActual: hoy.getFullYear(),
  drawerAbierto: false,
  setMesActual: (mes) => set({ mesActual: mes }),
  setAnioActual: (anio) => set({ anioActual: anio }),
  toggleDrawer: () => set((s) => ({ drawerAbierto: !s.drawerAbierto })),
  setDrawerAbierto: (abierto) => set({ drawerAbierto: abierto }),
}));
