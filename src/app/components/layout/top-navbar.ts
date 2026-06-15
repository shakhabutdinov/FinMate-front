import { Component, input, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import {
  SubscriptionStatus,
  Transaction,
  Goal,
  Asset,
  StockHolding,
  CryptoHolding,
} from '../../models/api.models';

declare var google: any;

interface NotificationItem {
  id: string;
  kind: 'info' | 'success' | 'warning';
  title: string;
  body: string;
  when: string;
  href?: string;
}

interface SearchResult {
  group: 'Transaction' | 'Asset' | 'Goal' | 'Stock' | 'Crypto';
  title: string;
  subtitle: string;
  amount?: number;
  href: string;
}

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <div
      class="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20"
    >
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-white tracking-wide">
          {{ title() }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          (click)="openSearch()"
          class="hidden sm:inline-flex items-center gap-2 h-9 px-3 rounded-full border transition-all"
          style="background: var(--surface-3); border-color: var(--border-1); color: var(--text-3);"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span class="text-xs hidden lg:inline">Search…</span>
          <span
            class="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded border"
            style="border-color: var(--border-1);"
            >⌘K</span
          >
        </button>
        <button
          (click)="openSearch()"
          class="sm:hidden p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>

        <button
          (click)="theme.toggle()"
          [attr.aria-label]="
            theme.theme() === 'dark'
              ? 'Switch to light mode'
              : 'Switch to dark mode'
          "
          class="relative inline-flex items-center gap-1 h-9 w-[68px] rounded-full border transition-all overflow-hidden"
          [class]="
            theme.theme() === 'dark'
              ? 'bg-gray-800/70 border-gray-700 hover:border-[#00FF88]/40'
              : 'bg-white/80 border-slate-200 hover:border-[#00FF88]/40'
          "
        >
          <span
            class="absolute top-0.5 h-7 w-7 rounded-full transition-all duration-300 flex items-center justify-center"
            [class]="
              theme.theme() === 'dark'
                ? 'left-0.5 bg-gradient-to-tr from-slate-700 to-slate-900 text-yellow-300'
                : 'left-[34px] bg-gradient-to-tr from-yellow-300 to-amber-500 text-white shadow-md'
            "
          >
            @if (theme.theme() === 'dark') {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m4.93 19.07 1.41-1.41" />
                <path d="m17.66 6.34 1.41-1.41" />
              </svg>
            }
          </span>
          <span
            class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-medium opacity-60"
            [class.opacity-0]="theme.theme() === 'dark'"
            [style.color]="'var(--text-4)'"
            >DARK</span
          >
          <span
            class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium opacity-60"
            [class.opacity-0]="theme.theme() === 'light'"
            [style.color]="'var(--text-4)'"
            >LIGHT</span
          >
        </button>

        <button
          (click)="openNotifications()"
          class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors relative"
          aria-label="Notifications"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path
              d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"
            />
          </svg>
          @if (unreadCount() > 0) {
            <span
              class="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00FF88] text-black text-[10px] font-bold flex items-center justify-center"
            >
              {{ unreadCount() > 9 ? '9+' : unreadCount() }}
            </span>
          }
        </button>

        <button
          (click)="showAccountPanel = !showAccountPanel"
          class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center text-black font-bold text-sm hover:ring-2 hover:ring-[#00FF88]/50 transition-all"
        >
          {{ authService.currentUser()?.initials || 'U' }}
        </button>
      </div>
    </div>

    @if (showSearch) {
      <div class="fixed inset-0 z-50" (click)="closeSearch()">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          class="relative mx-auto mt-16 lg:mt-20 w-full max-w-[640px] px-4 animate-fade-in"
          (click)="$event.stopPropagation()"
        >
          <div
            class="rounded-2xl border shadow-2xl overflow-hidden"
            style="background: var(--surface-modal); border-color: var(--border-1);"
          >
            <div
              class="flex items-center gap-3 px-4 h-14 border-b"
              style="border-color: var(--border-1);"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="color: var(--text-3);"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                #searchInput
                [(ngModel)]="searchQuery"
                (keydown.escape)="closeSearch()"
                placeholder="Search transactions, assets, goals, holdings…"
                class="flex-1 bg-transparent outline-none text-base"
                style="color: var(--text-1);"
              />
              @if (searchQuery) {
                <button
                  (click)="searchQuery = ''"
                  class="p-1 rounded hover:bg-black/5"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="color: var(--text-3);"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              }
              <kbd
                class="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded border"
                style="border-color: var(--border-1); color: var(--text-4);"
                >Esc</kbd
              >
            </div>

            <div class="max-h-[60vh] overflow-y-auto">
              @if (searchLoading) {
                <div class="flex items-center justify-center py-10">
                  <div
                    class="w-6 h-6 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"
                  ></div>
                </div>
              } @else if (!searchQuery) {
                <div class="px-4 py-3">
                  <div
                    class="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style="color: var(--text-4);"
                  >
                    Quick navigation
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    @for (q of quickLinks; track q.href) {
                      <button
                        (click)="go(q.href)"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[#00FF88]/10"
                        style="background: var(--surface-2); color: var(--text-2);"
                      >
                        <span class="text-base">{{ q.icon }}</span>
                        <span>{{ q.label }}</span>
                      </button>
                    }
                  </div>
                </div>
              } @else if (filteredResults().length === 0) {
                <div class="px-6 py-10 text-center">
                  <div class="text-3xl mb-2">🔍</div>
                  <div class="text-sm" style="color: var(--text-3);">
                    No matches for "{{ searchQuery }}"
                  </div>
                </div>
              } @else {
                @for (group of groupedResults(); track group.name) {
                  <div
                    class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider"
                    style="color: var(--text-4);"
                  >
                    {{ group.name }}
                  </div>
                  @for (r of group.items; track r.title + r.subtitle) {
                    <button
                      (click)="go(r.href)"
                      class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#00FF88]/10"
                      style="border-bottom: 1px solid var(--border-2);"
                    >
                      <div
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                        [style.background]="resultBg(r.group)"
                        [style.color]="resultFg(r.group)"
                      >
                        {{ resultIcon(r.group) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div
                          class="text-sm truncate"
                          style="color: var(--text-1);"
                        >
                          {{ r.title }}
                        </div>
                        <div
                          class="text-xs truncate"
                          style="color: var(--text-3);"
                        >
                          {{ r.subtitle }}
                        </div>
                      </div>
                      @if (r.amount !== undefined) {
                        <div
                          class="text-sm font-medium whitespace-nowrap"
                          style="color: var(--text-2);"
                        >
                          {{ r.amount | currency: 'USD' : 'symbol' : '1.0-2' }}
                        </div>
                      }
                    </button>
                  }
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (showNotifications) {
      <div class="fixed inset-0 z-50" (click)="showNotifications = false">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0"
        ></div>
        <div
          class="absolute top-0 right-0 w-full max-w-[430px] mx-auto left-0 lg:left-auto lg:right-2 lg:w-[380px]"
          (click)="$event.stopPropagation()"
        >
          <div
            class="m-3 mt-14 rounded-2xl shadow-2xl overflow-hidden border animate-fade-in"
            style="background: var(--surface-modal); border-color: var(--border-1);"
          >
            <div
              class="flex items-center justify-between px-4 py-3 border-b"
              style="border-color: var(--border-1);"
            >
              <div class="flex items-center gap-2">
                <span class="font-semibold" style="color: var(--text-1);"
                  >Notifications</span
                >
                @if (unreadCount() > 0) {
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style="background: rgba(0,255,136,0.18); color: #00FF88;"
                    >{{ unreadCount() }} new</span
                  >
                }
              </div>
              <button
                (click)="markAllRead()"
                class="text-xs hover:underline"
                style="color: var(--text-3);"
              >
                Mark all read
              </button>
            </div>

            <div class="max-h-[70vh] overflow-y-auto">
              @if (notifications().length === 0) {
                <div class="px-6 py-10 text-center">
                  <div class="text-3xl mb-2">✨</div>
                  <div class="text-sm" style="color: var(--text-3);">
                    You're all caught up!
                  </div>
                </div>
              } @else {
                @for (n of notifications(); track n.id) {
                  <button
                    (click)="onNotificationClick(n)"
                    class="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[#00FF88]/5"
                    style="border-bottom: 1px solid var(--border-2);"
                  >
                    <div
                      class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      [style.background]="kindBg(n.kind)"
                      [style.color]="kindFg(n.kind)"
                    >
                      @switch (n.kind) {
                        @case ('success') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        }
                        @case ('warning') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                            <path
                              d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                            />
                          </svg>
                        }
                        @default {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        }
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-medium"
                          style="color: var(--text-1);"
                          >{{ n.title }}</span
                        >
                        @if (!readIds().has(n.id)) {
                          <span
                            class="w-2 h-2 rounded-full bg-[#00FF88]"
                          ></span>
                        }
                      </div>
                      <div class="text-xs mt-0.5" style="color: var(--text-3);">
                        {{ n.body }}
                      </div>
                      <div
                        class="text-[10px] mt-1 uppercase tracking-wide"
                        style="color: var(--text-4);"
                      >
                        {{ n.when }}
                      </div>
                    </div>
                  </button>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (showAccountPanel) {
      <div class="fixed inset-0 z-50" (click)="showAccountPanel = false">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-0"
        ></div>
        <div
          class="absolute top-0 right-0 w-full max-w-[430px] mx-auto left-0 lg:left-auto lg:right-2 lg:w-[360px]"
          (click)="$event.stopPropagation()"
        >
          <div
            class="m-3 mt-14 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
          >
            <div class="p-5 border-b border-gray-800">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0"
                >
                  {{ authService.currentUser()?.initials || 'U' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-semibold truncate">
                    {{ authService.currentUser()?.firstName }}
                    {{ authService.currentUser()?.lastName }}
                  </div>
                  <div class="text-gray-400 text-sm truncate">
                    {{ authService.currentUser()?.email }}
                  </div>
                </div>
              </div>
            </div>

            <div class="p-5 border-b border-gray-800">
              @if (subStatus(); as sub) {
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class]="
                        sub.isActive
                          ? sub.isTrial
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-[#00FF88]/20 text-[#00FF88]'
                          : 'bg-red-500/20 text-red-400'
                      "
                    >
                      {{ sub.planName }}
                    </span>
                    @if (sub.isActive) {
                      <span class="text-xs text-gray-400"
                        >{{ sub.daysRemaining }} days left</span
                      >
                    }
                  </div>
                  @if (sub.isActive) {
                    <div
                      class="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"
                    ></div>
                  } @else {
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                  }
                </div>

                @if (sub.isActive) {
                  <div
                    class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3"
                  >
                    <div
                      class="h-full rounded-full transition-all"
                      [style.width.%]="(sub.daysRemaining / 30) * 100"
                      [class]="sub.isTrial ? 'bg-blue-500' : 'bg-[#00FF88]'"
                    ></div>
                  </div>
                }

                @if (!sub.isActive || sub.isTrial) {
                  <button
                    (click)="activateWithGooglePay()"
                    [disabled]="activating"
                    class="w-full flex items-center justify-center gap-2 h-10 rounded-xl font-medium text-sm transition-all"
                    [class]="
                      sub.isActive
                        ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                        : 'bg-[#00FF88] hover:bg-[#00FF88]/90 text-black'
                    "
                  >
                    @if (activating) {
                      <div
                        class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                      ></div>
                    } @else {
                      <svg
                        viewBox="0 0 24 24"
                        class="w-4 h-4"
                        fill="currentColor"
                      >
                        <path
                          d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"
                        />
                      </svg>
                      {{
                        sub.isActive
                          ? 'Upgrade to Premium'
                          : 'Activate with Google Pay'
                      }}
                    }
                  </button>
                  @if (payError) {
                    <div class="text-red-400 text-xs mt-2">{{ payError }}</div>
                  }
                }
              } @else {
                <div class="flex items-center justify-center py-2">
                  <div
                    class="w-4 h-4 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"
                  ></div>
                </div>
              }
            </div>

            <div class="p-2">
              <button
                (click)="logout()"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors text-left"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="text-red-400"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span class="text-red-400 text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-fade-in {
        animation: fadeIn 0.2s ease-out;
      }
    `,
  ],
})
export class TopNavbarComponent implements OnInit {
  title = input<string>('Dashboard');
  showAccountPanel = false;
  activating = false;
  payError = '';

  subStatus = signal<SubscriptionStatus | null>(null);

  showSearch = false;
  searchQuery = '';
  searchLoading = false;
  private searchData = signal<{
    transactions: Transaction[];
    assets: Asset[];
    goals: Goal[];
    stocks: StockHolding[];
    crypto: CryptoHolding[];
  }>({
    transactions: [],
    assets: [],
    goals: [],
    stocks: [],
    crypto: [],
  });

  quickLinks = [
    { label: 'Dashboard', icon: '🏠', href: '/dashboard' },
    { label: 'Personal Finance', icon: '💼', href: '/pfm' },
    { label: 'Stocks', icon: '📈', href: '/stocks' },
    { label: 'Crypto', icon: '₿', href: '/crypto' },
    { label: 'AI Assistant', icon: '🤖', href: '/ai' },
  ];

  showNotifications = false;
  notifications = signal<NotificationItem[]>([]);
  readIds = signal<Set<string>>(this.loadReadIds());
  unreadCount = computed(() => {
    const reads = this.readIds();
    return this.notifications().filter((n) => !reads.has(n.id)).length;
  });

  filteredResults = computed<SearchResult[]>(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return [];
    const d = this.searchData();
    const out: SearchResult[] = [];

    for (const t of d.transactions) {
      const hay = `${t.category} ${t.description} ${t.type}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          group: 'Transaction',
          title: `${t.category}${t.description ? ' · ' + t.description : ''}`,
          subtitle: `${t.type} · ${this.fmtDate(t.date)}`,
          amount: t.amount,
          href: '/pfm',
        });
      }
    }
    for (const a of d.assets) {
      if ((a.name + ' ' + a.type).toLowerCase().includes(q)) {
        out.push({
          group: 'Asset',
          title: a.name,
          subtitle: a.type,
          amount: a.balance,
          href: this.routeForAsset(a.type),
        });
      }
    }
    for (const g of d.goals) {
      if (g.name.toLowerCase().includes(q)) {
        out.push({
          group: 'Goal',
          title: g.name,
          subtitle: `${g.progressPercent}% complete`,
          amount: g.targetAmount,
          href: '/pfm',
        });
      }
    }
    for (const s of d.stocks) {
      if ((s.symbol + ' ' + s.companyName).toLowerCase().includes(q)) {
        out.push({
          group: 'Stock',
          title: `${s.symbol} · ${s.companyName}`,
          subtitle: `${s.quantity} shares`,
          amount: s.totalValue,
          href: '/stocks',
        });
      }
    }
    for (const c of d.crypto) {
      if ((c.symbol + ' ' + c.name).toLowerCase().includes(q)) {
        out.push({
          group: 'Crypto',
          title: `${c.symbol} · ${c.name}`,
          subtitle: `${c.amount} units`,
          amount: c.totalValue,
          href: '/crypto',
        });
      }
    }
    return out.slice(0, 30);
  });

  groupedResults = computed(() => {
    const grouped = new Map<string, SearchResult[]>();
    for (const r of this.filteredResults()) {
      const arr = grouped.get(r.group) ?? [];
      arr.push(r);
      grouped.set(r.group, arr);
    }
    return Array.from(grouped, ([name, items]) => ({ name, items }));
  });

  constructor(
    public authService: AuthService,
    private api: ApiService,
    public theme: ThemeService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadSubscription();
      this.loadSearchAndNotifications();
    }

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openSearch();
      }
    });
  }

  openSearch() {
    this.showSearch = true;
    this.showNotifications = false;
    this.showAccountPanel = false;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[placeholder^="Search"]',
      );
      el?.focus();
    }, 30);
  }
  closeSearch() {
    this.showSearch = false;
    this.searchQuery = '';
  }
  go(href: string) {
    this.closeSearch();
    this.showNotifications = false;
    this.router.navigateByUrl(href);
  }

  resultIcon(g: SearchResult['group']) {
    return g === 'Transaction'
      ? '💸'
      : g === 'Asset'
        ? '💼'
        : g === 'Goal'
          ? '🎯'
          : g === 'Stock'
            ? '📈'
            : '₿';
  }
  resultBg(g: SearchResult['group']) {
    return g === 'Transaction'
      ? 'rgba(248,113,113,0.15)'
      : g === 'Asset'
        ? 'rgba(0,255,136,0.15)'
        : g === 'Goal'
          ? 'rgba(168,85,247,0.15)'
          : g === 'Stock'
            ? 'rgba(59,130,246,0.15)'
            : 'rgba(245,158,11,0.15)';
  }
  resultFg(g: SearchResult['group']) {
    return g === 'Transaction'
      ? '#f87171'
      : g === 'Asset'
        ? '#00FF88'
        : g === 'Goal'
          ? '#a855f7'
          : g === 'Stock'
            ? '#3b82f6'
            : '#f59e0b';
  }

  openNotifications() {
    this.showNotifications = !this.showNotifications;
    this.showSearch = false;
    this.showAccountPanel = false;
  }
  onNotificationClick(n: NotificationItem) {
    const reads = new Set(this.readIds());
    reads.add(n.id);
    this.readIds.set(reads);
    this.persistReadIds(reads);
    if (n.href) this.go(n.href);
  }
  markAllRead() {
    const reads = new Set(this.notifications().map((n) => n.id));
    this.readIds.set(reads);
    this.persistReadIds(reads);
  }
  kindBg(k: NotificationItem['kind']) {
    return k === 'success'
      ? 'rgba(0,255,136,0.15)'
      : k === 'warning'
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(59,130,246,0.15)';
  }
  kindFg(k: NotificationItem['kind']) {
    return k === 'success'
      ? '#00FF88'
      : k === 'warning'
        ? '#f59e0b'
        : '#3b82f6';
  }

  logout() {
    this.showAccountPanel = false;
    this.authService.logout();
  }

  activateWithGooglePay() {
    this.activating = true;
    this.payError = '';

    if (typeof google === 'undefined' || !google.payments) {
      this.processPayment('gpay_simulated_token');
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST',
      });
      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'example',
                gatewayMerchantId: 'exampleGatewayMerchantId',
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: 'BCR2DN4T7OL6JMGF',
          merchantName: 'FinMate',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: '9.99',
          currencyCode: 'USD',
          countryCode: 'US',
        },
      };
      paymentsClient
        .loadPaymentData(paymentDataRequest)
        .then((paymentData: any) =>
          this.processPayment(
            paymentData.paymentMethodData.tokenizationData.token,
          ),
        )
        .catch(() => {
          this.activating = false;
          this.payError = 'Payment was cancelled.';
        });
    } catch {
      this.processPayment('gpay_simulated_token');
    }
  }

  private processPayment(token: string) {
    this.api.activateSubscription(token, 'google_pay').subscribe({
      next: (status) => {
        this.subStatus.set(status);
        this.authService.subscriptionStatus.set(status);
        this.activating = false;
        const user = this.authService.currentUser();
        if (user) {
          const updated = {
            ...user,
            subscriptionEndDate: status.subscriptionEndDate,
            isActive: status.isActive,
            daysRemaining: status.daysRemaining,
          };
          this.authService.currentUser.set(updated);
          localStorage.setItem('finmate_user', JSON.stringify(updated));
        }
      },
      error: (err) => {
        this.payError = err.error?.error || 'Payment failed. Please try again.';
        this.activating = false;
      },
    });
  }

  private loadSubscription() {
    this.api.getSubscriptionStatus().subscribe({
      next: (status) => {
        this.subStatus.set(status);
        this.authService.subscriptionStatus.set(status);
        this.rebuildNotifications();
      },
      error: () => {},
    });
  }

  private loadSearchAndNotifications() {
    this.searchLoading = true;
    const safe = <T>(obs: any, fb: T) =>
      (obs as any).pipe(catchError(() => of(fb)));
    forkJoin({
      transactions: safe(this.api.getTransactions(), []),
      dashboard: safe(this.api.getDashboard(), null),
      goals: safe(this.api.getGoals(), []),
      stocks: safe(this.api.getStockPortfolio(), null),
      crypto: safe(this.api.getCryptoPortfolio(), null),
    }).subscribe((res: any) => {
      this.searchData.set({
        transactions: res.transactions ?? [],
        assets: res.dashboard?.assets ?? [],
        goals: res.goals ?? [],
        stocks: res.stocks?.holdings ?? [],
        crypto: res.crypto?.holdings ?? [],
      });
      this.searchLoading = false;
      this.rebuildNotifications();
    });
  }

  private rebuildNotifications() {
    const list: NotificationItem[] = [];
    const data = this.searchData();
    const sub = this.subStatus();

    if (sub) {
      if (!sub.isActive) {
        list.push({
          id: 'sub-expired',
          kind: 'warning',
          title: 'Subscription expired',
          body: 'Reactivate to keep AI features and exports.',
          when: 'Now',
        });
      } else if (sub.daysRemaining <= 7) {
        list.push({
          id: 'sub-expiring',
          kind: 'warning',
          title: sub.isTrial ? 'Trial ends soon' : 'Renewal soon',
          body: `${sub.daysRemaining} day${sub.daysRemaining === 1 ? '' : 's'} remaining on your ${sub.planName} plan.`,
          when: 'Today',
        });
      }
    }

    for (const g of data.goals) {
      if (g.progressPercent >= 100) {
        list.push({
          id: `goal-done-${g.id}`,
          kind: 'success',
          title: 'Goal reached 🎉',
          body: `"${g.name}" is fully funded.`,
          when: 'Recent',
          href: '/pfm',
        });
      } else if (g.progressPercent >= 90) {
        list.push({
          id: `goal-near-${g.id}`,
          kind: 'success',
          title: 'Almost there',
          body: `"${g.name}" is at ${g.progressPercent}%.`,
          when: 'Recent',
          href: '/pfm',
        });
      }
    }

    const recent = [...data.transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 4);
    for (const t of recent) {
      list.push({
        id: `tx-${t.id}`,
        kind: t.type === 'Income' ? 'success' : 'info',
        title:
          t.type === 'Income'
            ? `Income · ${t.category}`
            : `Spent on ${t.category}`,
        body: `${t.type === 'Income' ? '+' : '-'}$${t.amount.toFixed(2)}${t.description ? ' · ' + t.description : ''}`,
        when: this.relativeTime(t.date),
        href: '/pfm',
      });
    }

    this.notifications.set(list);
  }

  private routeForAsset(type: string): string {
    return type === 'Stock'
      ? '/stocks'
      : type === 'Crypto'
        ? '/crypto'
        : '/dashboard';
  }

  private fmtDate(d: string | Date) {
    return new Date(d).toLocaleDateString();
  }

  private relativeTime(d: string | Date): string {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(d).toLocaleDateString();
  }

  private loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem('finmate_read_notifications');
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  }
  private persistReadIds(s: Set<string>) {
    try {
      localStorage.setItem(
        'finmate_read_notifications',
        JSON.stringify(Array.from(s)),
      );
    } catch {}
  }
}
