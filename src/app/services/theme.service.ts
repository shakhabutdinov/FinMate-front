import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'finmate_theme';

  theme = signal<Theme>(this.loadInitial());

  constructor() {
    effect(() => {
      const t = this.theme();
      const root = document.documentElement;
      root.classList.toggle('theme-light', t === 'light');
      root.classList.toggle('theme-dark', t === 'dark');
      try { localStorage.setItem(this.storageKey, t); } catch {}
    });
  }

  toggle() {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private loadInitial(): Theme {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  }
}
