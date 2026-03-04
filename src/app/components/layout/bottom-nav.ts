import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 absolute bottom-0 left-0 right-0 z-30">
      <div class="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        @for (item of navItems; track item.route) {
          <a [routerLink]="item.route" class="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200" [class]="activePage() === item.id ? 'text-[#00FF88]' : 'text-gray-400 hover:text-gray-300'">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <span class="text-xs" [class.font-medium]="activePage() === item.id">{{ item.label }}</span>
            @if (activePage() === item.id) {
              <div class="w-1 h-1 bg-[#00FF88] rounded-full mt-0.5"></div>
            }
          </a>
        }
      </div>
    </nav>
  `
})
export class BottomNavComponent {
  activePage = input<string>('main');

  navItems = [
    { id: 'main', label: 'Main', route: '/dashboard' },
    { id: 'pfm', label: 'PFM', route: '/pfm' },
    { id: 'stocks', label: 'Stocks', route: '/stocks' },
    { id: 'crypto', label: 'Crypto', route: '/crypto' },
    { id: 'ai', label: 'AI', route: '/ai' },
  ];
}
