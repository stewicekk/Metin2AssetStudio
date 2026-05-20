// frontend/src/utils/formatUtils.ts
import { useAppStore } from '../store/useAppStore';

export function fmt(n: number | undefined, dec?: number): string {
  // Přeneste logiku exportPrec sem nebo zajistěte, že useAppStore je dostupný v kontextu
  // Prozatím předpokládejme, že to bude fungovat, ale je třeba zvážit, jak to nejlépe integrovat do non-React kontextu
  const exportPrec = useAppStore.getState().settings.exportPrec; // Získání z Zustand store
  const precision = dec ?? exportPrec;
  return (typeof n === 'number' ? n : 0).toFixed(precision);
}
