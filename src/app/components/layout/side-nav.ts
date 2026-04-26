import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="hidden lg:flex flex-col w-[248px] flex-shrink-0 h-full border-r"
      style="background: var(--surface-strong); border-color: var(--border-1);">
      <div class="px-6 py-6 flex items-center gap-2">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center text-black font-bold">F</div>
        <div class="flex flex-col leading-tight">
          <span class="font-bold text-base" style="color: var(--text-1);">FinMate</span>
          <span class="text-[11px]" style="color: var(--text-4);">Personal Finance</span>
        </div>
      </div>

      <nav class="flex-1 px-3 space-y-1">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route"
            class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            [class]="activePage() === item.id
              ? 'bg-[#00FF88]/15 text-[#00FF88]'
              : 'hover:bg-black/5 dark:hover:bg-white/5'"
            [style.color]="activePage() === item.id ? '#00FF88' : 'var(--text-2)'">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              @switch (item.id) {
                @case ('main') {
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                }
                @case ('pfm') {
                  <path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/>
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                }
                @case ('stocks') {
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                }
                @case ('crypto') {
                  <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727"/>
                }
                @case ('ai') {
                  <path d="M12 8V4H8"/>
                  <rect width="16" height="12" x="4" y="8" rx="2"/>
                  <path d="M2 14h2"/>
                  <path d="M20 14h2"/>
                  <path d="M15 13v2"/>
                  <path d="M9 13v2"/>
                }
              }
            </svg>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="px-4 py-5 border-t" style="border-color: var(--border-1);">
        <div class="text-[11px] uppercase tracking-wider" style="color: var(--text-4);">v1.0 · FinMate</div>
      </div>
    </aside>
  `
})
export class SideNavComponent {
  activePage = input<string>('main');

  navItems = [
    { id: 'main', label: 'Dashboard', route: '/dashboard' },
    { id: 'pfm', label: 'Personal Finance', route: '/pfm' },
    { id: 'stocks', label: 'Stocks', route: '/stocks' },
    { id: 'crypto', label: 'Crypto', route: '/crypto' },
    { id: 'ai', label: 'AI Assistant', route: '/ai' }
  ];
}
