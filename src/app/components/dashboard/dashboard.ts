import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { ExportService } from '../../services/export.service';
import { CashflowChartComponent } from '../charts/cashflow-chart';
import { DashboardData, Transaction, PfmOverview, Goal } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent, CashflowChartComponent, CurrencyPipe, DecimalPipe, DatePipe],
  template: `
    <app-main-layout pageTitle="Dashboard" activePage="main">
      @if (data) {
        <div class="p-4 lg:p-0 space-y-6">

          <!-- ===== Top stats row ===== -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="rounded-2xl p-4 border" style="background: var(--surface-2); border-color: var(--border-1);">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] uppercase tracking-wider" style="color: var(--text-4);">Income · MTD</span>
                <span class="text-base">📈</span>
              </div>
              <div class="text-lg lg:text-xl font-semibold" style="color: #00FF88;">
                {{ (overview?.incomeMtd ?? 0) | currency:'USD':'symbol':'1.0-0' }}
              </div>
            </div>
            <div class="rounded-2xl p-4 border" style="background: var(--surface-2); border-color: var(--border-1);">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] uppercase tracking-wider" style="color: var(--text-4);">Expenses · MTD</span>
                <span class="text-base">💸</span>
              </div>
              <div class="text-lg lg:text-xl font-semibold" style="color: #ef4444;">
                {{ (overview?.expensesMtd ?? 0) | currency:'USD':'symbol':'1.0-0' }}
              </div>
            </div>
            <div class="rounded-2xl p-4 border" style="background: var(--surface-2); border-color: var(--border-1);">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] uppercase tracking-wider" style="color: var(--text-4);">Net Cashflow</span>
                <span class="text-base">⚖️</span>
              </div>
              <div class="text-lg lg:text-xl font-semibold" [style.color]="netMtd() >= 0 ? '#00FF88' : '#ef4444'">
                {{ netMtd() | currency:'USD':'symbol':'1.0-0' }}
              </div>
            </div>
            <div class="rounded-2xl p-4 border" style="background: var(--surface-2); border-color: var(--border-1);">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] uppercase tracking-wider" style="color: var(--text-4);">Savings Rate</span>
                <span class="text-base">🎯</span>
              </div>
              <div class="text-lg lg:text-xl font-semibold" style="color: var(--text-1);">{{ savingsRate() }}%</div>
              <div class="mt-2 w-full h-1.5 rounded-full" style="background: var(--surface-3);">
                <div class="h-full rounded-full" [style.width.%]="Math.max(0, Math.min(100, savingsRate()))"
                  style="background: linear-gradient(90deg, #00FF88, #06b774);"></div>
              </div>
            </div>
          </div>

          <!-- ===== Main grid ===== -->
          <div class="grid gap-6 lg:grid-cols-3">

            <!-- LEFT: Balance + Export + Cashflow chart -->
            <div class="lg:col-span-2 space-y-6">

              <!-- Balance Card -->
              <div class="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl p-5 lg:p-7 border border-gray-700">
                <div class="flex items-center justify-between mb-3">
                  <h1 class="text-gray-400 text-sm">Total Balance</h1>
                  <button (click)="balanceVisible = !balanceVisible" class="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                    @if (balanceVisible) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                    }
                  </button>
                </div>
                <div class="mb-4">
                  <p class="text-4xl lg:text-5xl text-white font-bold mb-2">
                    @if (balanceVisible) {
                      {{ data.totalBalance | currency:'USD':'symbol':'1.0-0' }}
                    } @else {
                      ••••••
                    }
                  </p>
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#00FF88]"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    <span class="text-sm text-[#00FF88]">+{{ data.changePercent | number:'1.2-2' }}% ({{ data.changeAmount | currency:'USD':'symbol':'1.0-0' }})</span>
                    <span class="text-sm text-gray-400">from last month</span>
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-2 relative">
                  <button (click)="toggleAssetMenu($event)"
                    class="inline-flex items-center justify-center gap-1 py-2 px-2 bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600 h-10 text-xs rounded-md font-medium transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
                    Edit Asset
                  </button>
                  <button (click)="openModal('Expense')" class="inline-flex items-center justify-center gap-1 py-2 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 h-10 text-xs rounded-md font-medium transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Expense
                  </button>
                  <button (click)="openModal('Income')" class="inline-flex items-center justify-center gap-1 py-2 px-2 bg-[#00FF88]/20 hover:bg-[#00FF88]/30 text-[#00FF88] border border-[#00FF88]/30 h-10 text-xs rounded-md font-medium transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Income
                  </button>

                  @if (showAssetMenu) {
                    <div class="absolute top-12 left-0 z-30 w-56 rounded-xl border shadow-xl overflow-hidden animate-fade-in"
                      style="background: var(--surface-modal); border-color: var(--border-1);"
                      (click)="$event.stopPropagation()">
                      <a routerLink="/stocks" (click)="showAssetMenu = false"
                        class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#00FF88]/10 transition-colors"
                        style="border-bottom: 1px solid var(--border-2);">
                        <span class="text-lg">📈</span>
                        <div class="flex-1">
                          <div class="text-sm font-medium" style="color: var(--text-1);">Manage Stocks</div>
                          <div class="text-[11px]" style="color: var(--text-4);">Add or remove holdings</div>
                        </div>
                      </a>
                      <a routerLink="/crypto" (click)="showAssetMenu = false"
                        class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#00FF88]/10 transition-colors"
                        style="border-bottom: 1px solid var(--border-2);">
                        <span class="text-lg">₿</span>
                        <div class="flex-1">
                          <div class="text-sm font-medium" style="color: var(--text-1);">Manage Crypto</div>
                          <div class="text-[11px]" style="color: var(--text-4);">Add or remove holdings</div>
                        </div>
                      </a>
                      <a routerLink="/pfm" [queryParams]="{ tab: 'Goals' }" (click)="showAssetMenu = false"
                        class="flex items-center gap-3 px-3 py-2.5 hover:bg-[#00FF88]/10 transition-colors">
                        <span class="text-lg">🎯</span>
                        <div class="flex-1">
                          <div class="text-sm font-medium" style="color: var(--text-1);">Manage Goals</div>
                          <div class="text-[11px]" style="color: var(--text-4);">Adjust savings goals</div>
                        </div>
                      </a>
                    </div>
                  }
                </div>
              </div>

              <!-- Excel Export CTA -->
              <button (click)="downloadExcel()" [disabled]="downloading"
                class="group relative w-full overflow-hidden rounded-3xl border transition-all duration-300 disabled:opacity-70 disabled:cursor-wait"
                style="border-color: rgba(0,255,136,0.30);
                       background: linear-gradient(135deg, rgba(0,255,136,0.12), rgba(16,185,129,0.06) 50%, rgba(0,0,0,0.08));">
                <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style="background: radial-gradient(80% 120% at 0% 0%, rgba(0,255,136,0.18), transparent 60%);"></div>
                <div class="relative flex items-center gap-4 p-5 lg:p-6 text-left">
                  <div class="flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                    style="background: linear-gradient(135deg, #00FF88, #06b774); box-shadow: 0 8px 24px rgba(0,255,136,0.35);">
                    @if (downloading) {
                      <div class="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="text-base lg:text-lg font-semibold" style="color: var(--text-1);">
                        {{ downloading ? 'Preparing your export…' : 'Download all data' }}
                      </h3>
                      <span class="hidden sm:inline-flex text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md"
                        style="background: rgba(0,255,136,0.18); color: #00FF88;">EXCEL</span>
                    </div>
                    <p class="text-xs lg:text-sm" style="color: var(--text-3);">
                      Multi-sheet Excel workbook — balance, transactions, assets, stocks, crypto, goals and cashflow.
                    </p>
                  </div>
                  <div class="hidden sm:flex w-9 h-9 rounded-full items-center justify-center transition-transform duration-300 group-hover:translate-x-1"
                    style="background: rgba(0,255,136,0.12); color: #00FF88;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
                @if (downloadError) {
                  <div class="px-5 pb-4 -mt-1 text-xs text-red-400 text-left">{{ downloadError }}</div>
                }
              </button>

              <!-- Mini cashflow chart -->
              @if (transactions.length) {
                <app-cashflow-chart [transactions]="transactions" initialPeriod="month" />
              }
            </div>

            <!-- RIGHT: Assets + Goals + Recent Activity -->
            <div class="space-y-5">
              <div>
                <h2 class="text-sm mb-3" style="color: var(--text-3);">Your Assets</h2>
                <div class="space-y-3">
                  @for (asset of data.assets; track asset.id) {
                    <a [routerLink]="getAssetRoute(asset.type)" class="w-full bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700 rounded-2xl p-3 transition-all duration-200 hover:border-[#00FF88]/30 flex items-center gap-3">
                      <div class="text-2xl">{{ getAssetEmoji(asset.type) }}</div>
                      <div class="flex-1 text-left min-w-0">
                        <h3 class="text-white font-medium mb-0.5 text-sm">{{ asset.name }}</h3>
                        <p class="text-xl text-white font-semibold mb-1">{{ asset.balance | currency:'USD':'symbol':'1.0-0' }}</p>
                        <div class="flex items-center gap-1">
                          <span class="text-xs text-gray-400">vs yesterday:</span>
                          @if (asset.changePercent >= 0) {
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#00FF88]"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                            <span class="text-xs text-[#00FF88]">+{{ asset.changePercent | number:'1.2-2' }}%</span>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
                            <span class="text-xs text-red-400">{{ asset.changePercent | number:'1.2-2' }}%</span>
                          }
                        </div>
                      </div>
                      <div class="w-20 h-12 flex-shrink-0">
                        <svg width="80" height="48" viewBox="0 0 80 48" class="w-full h-full">
                          <path [attr.d]="buildSparklinePath(asset.sparklineData)" fill="none"
                            [attr.stroke]="asset.changePercent >= 0 ? '#00FF88' : '#f87171'"
                            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </div>
                    </a>
                  }
                </div>
              </div>

              <!-- Top goals progress -->
              @if (goals.length) {
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h2 class="text-sm" style="color: var(--text-3);">Goals</h2>
                    <a routerLink="/pfm" [queryParams]="{ tab: 'Goals' }" class="text-xs text-[#00FF88] hover:underline">View all</a>
                  </div>
                  <div class="space-y-3">
                    @for (g of topGoals(); track g.id) {
                      <div class="rounded-2xl border p-3" style="background: var(--surface-2); border-color: var(--border-1);">
                        <div class="flex items-center justify-between mb-1.5">
                          <span class="text-sm font-medium truncate" style="color: var(--text-1);">{{ g.name }}</span>
                          <span class="text-xs font-semibold" style="color: #00FF88;">{{ g.progressPercent }}%</span>
                        </div>
                        <div class="w-full h-1.5 rounded-full overflow-hidden" style="background: var(--surface-3);">
                          <div class="h-full rounded-full" [style.width.%]="g.progressPercent"
                            style="background: linear-gradient(90deg, #00FF88, #06b774);"></div>
                        </div>
                        <div class="flex justify-between mt-1.5 text-[11px]" style="color: var(--text-4);">
                          <span>{{ g.currentAmount | currency:'USD':'symbol':'1.0-0' }} saved</span>
                          <span>{{ g.targetAmount | currency:'USD':'symbol':'1.0-0' }}</span>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Recent Activity -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-sm" style="color: var(--text-3);">Recent Activity</h2>
                  <a routerLink="/pfm" [queryParams]="{ tab: 'Transactions' }" class="text-xs text-[#00FF88] hover:underline">See all</a>
                </div>
                @if (recentTransactions().length) {
                  <div class="rounded-2xl border overflow-hidden" style="background: var(--surface-2); border-color: var(--border-1);">
                    @for (t of recentTransactions(); track t.id) {
                      <div class="flex items-center gap-3 px-3 py-2.5" style="border-bottom: 1px solid var(--border-2);">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          [style.background]="t.type === 'Income' ? 'rgba(0,255,136,0.15)' : 'rgba(239,68,68,0.15)'">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            [attr.stroke]="t.type === 'Income' ? '#00FF88' : '#ef4444'"
                            stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            @if (t.type === 'Income') {
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                            } @else {
                              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
                            }
                          </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="text-sm truncate" style="color: var(--text-1);">{{ t.category }}</div>
                          <div class="text-[11px] truncate" style="color: var(--text-4);">{{ t.description || (t.date | date:'MMM d') }}</div>
                        </div>
                        <div class="text-sm font-semibold whitespace-nowrap"
                          [style.color]="t.type === 'Income' ? '#00FF88' : '#ef4444'">
                          {{ t.type === 'Income' ? '+' : '-' }}{{ t.amount | currency:'USD':'symbol':'1.0-0' }}
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="rounded-2xl border p-6 text-center text-xs"
                    style="background: var(--surface-2); border-color: var(--border-1); color: var(--text-3);">
                    No transactions yet.
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Modal Overlay -->
        @if (showModal) {
          <div class="fixed inset-0 z-50 flex items-end justify-center lg:items-center" (click)="closeModal()">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div class="relative w-full max-w-[430px] bg-gray-900 border-t lg:border lg:rounded-3xl border-gray-700 rounded-t-3xl p-5 pb-8 animate-slide-up" (click)="$event.stopPropagation()">
              <div class="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5 lg:hidden"></div>
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-white">{{ modalType === 'Expense' ? 'Add Expense' : 'Add Income' }}</h2>
                <button (click)="closeModal()" class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <!-- 1. Category -->
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-gray-400 text-xs">Category</label>
                  @if (txForm.value.category) {
                    <button (click)="clearCategory()" class="text-[10px] hover:underline" style="color: var(--text-4);">Clear</button>
                  }
                </div>
                <div class="flex flex-wrap gap-2">
                  @for (cat of (modalType === 'Expense' ? expenseCategories : incomeCategories); track cat) {
                    <button (click)="pickCategory(cat)"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                      [class]="txForm.value.category === cat
                        ? (modalType === 'Expense'
                          ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : 'bg-[#00FF88]/20 text-[#00FF88] border-[#00FF88]/40')
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'">
                      {{ cat }}
                    </button>
                  }
                </div>
              </div>

              <!-- divider with OR (expense only — goals are expense-side allocations) -->
              @if (modalType === 'Expense' && goals.length) {
                <div class="flex items-center gap-3 my-3">
                  <div class="flex-1 h-px" style="background: var(--border-1);"></div>
                  <span class="text-[10px] font-bold tracking-wider" style="color: var(--text-4);">OR</span>
                  <div class="flex-1 h-px" style="background: var(--border-1);"></div>
                </div>

                <!-- 2. Goals -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-xs flex items-center gap-1.5" style="color: #c4b5fd;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      Goals
                    </label>
                    @if (selectedGoalId) {
                      <button (click)="selectedGoalId = null" class="text-[10px] hover:underline" style="color: var(--text-4);">Clear</button>
                    }
                  </div>
                  <div class="flex flex-wrap gap-2">
                    @for (g of goals; track g.id) {
                      <button (click)="pickGoal(g.id)"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                        [class]="selectedGoalId === g.id
                          ? 'bg-violet-500/25 text-violet-300 border-violet-400/50'
                          : 'bg-violet-500/5 text-violet-300/80 border-violet-400/20 hover:border-violet-400/40'">
                        <span>{{ getGoalEmojiForName(g.name) }}</span>
                        <span class="truncate max-w-[120px]">{{ g.name }}</span>
                        <span class="text-[10px] opacity-70">{{ g.progressPercent }}%</span>
                      </button>
                    }
                  </div>
                  @if (selectedGoalId && txForm.value.amount) {
                    <div class="mt-2 text-[11px] flex items-center gap-1.5" style="color: #a78bfa;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                      {{ txForm.value.amount | currency:'USD':'symbol':'1.0-2' }}
                      will be added to "{{ selectedGoalName() }}"
                    </div>
                  }
                </div>
              }

              <!-- 3. Amount -->
              <div class="mb-4">
                <label class="text-gray-400 text-xs mb-1 block">Amount</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input type="number" [formControl]="txForm.controls.amount" placeholder="0.00"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg pl-7 pr-3 focus:outline-none focus:ring-2 transition-all"
                    [class]="modalType === 'Expense' ? 'focus:ring-red-500/50 focus:border-red-500/50' : 'focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50'">
                </div>
              </div>

              <!-- 4. Description -->
              <div class="mb-5">
                <label class="text-gray-400 text-xs mb-1 block">Description <span class="text-gray-500">(optional)</span></label>
                <input type="text" [formControl]="txForm.controls.description" placeholder="What was this for?"
                  class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 transition-all"
                  [class]="modalType === 'Expense' ? 'focus:ring-red-500/50 focus:border-red-500/50' : 'focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50'">
              </div>

              @if (txError) { <div class="text-red-400 text-sm mb-3">{{ txError }}</div> }
              <button (click)="submitTransaction()" [disabled]="!canSubmit() || txSaving"
                class="w-full h-12 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                [class]="modalType === 'Expense' ? 'bg-red-500 hover:bg-red-500/90 text-white' : 'bg-[#00FF88] hover:bg-[#00FF88]/90 text-black'">
                @if (txSaving) {
                  <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
                } @else {
                  {{ modalType === 'Expense' ? 'Add Expense' : 'Add Income' }}
                }
              </button>
              @if (!canSubmit() && !txSaving && (txForm.value.amount ?? 0) > 0) {
                <p class="mt-2 text-[11px] text-center" style="color: var(--text-4);">
                  {{ modalType === 'Expense' ? 'Pick a category or a goal to continue.' : 'Pick a category to continue.' }}
                </p>
              }
            </div>
          </div>
        }

        @if (showToast) {
          <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-[380px] w-full px-4">
            <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl"
              [class]="toastType === 'Income' ? 'bg-[#00FF88]/10 border-[#00FF88]/30' : 'bg-red-500/10 border-red-500/30'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                [class]="toastType === 'Income' ? 'bg-[#00FF88]/20' : 'bg-red-500/20'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  [class]="toastType === 'Income' ? 'text-[#00FF88]' : 'text-red-400'"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span class="text-sm font-medium text-white">{{ toastMessage }}</span>
            </div>
          </div>
        }

        @if (showExportToast) {
          <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-[380px] w-full px-4">
            <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#00FF88]/30 bg-[#00FF88]/10 shadow-xl backdrop-blur-xl">
              <div class="w-8 h-8 rounded-full bg-[#00FF88]/20 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span class="text-sm font-medium text-white">Excel workbook downloaded</span>
            </div>
          </div>
        }
      } @else {
        <div class="flex items-center justify-center h-64">
          <div class="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    </app-main-layout>
  `,
  styles: [`
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .animate-slide-up { animation: slideUp 0.3s ease-out; }
  `]
})
export class DashboardComponent implements OnInit {
  Math = Math;
  data: DashboardData | null = null;
  overview: PfmOverview | null = null;
  transactions: Transaction[] = [];
  goals: Goal[] = [];

  balanceVisible = true;

  showModal = false;
  modalType: 'Expense' | 'Income' = 'Expense';
  txSaving = false;
  txError = '';

  showToast = false;
  toastMessage = '';
  toastType: 'Expense' | 'Income' = 'Income';

  downloading = false;
  downloadError = '';
  showExportToast = false;

  showAssetMenu = false;
  selectedGoalId: string | null = null;

  expenseCategories = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
  incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'];

  goalEmojiMap: Record<string, string> = {
    'new car': '🚗', 'car': '🚗',
    'house': '🏠', 'home': '🏠', 'apartment': '🏠',
    'vacation': '🏖️', 'trip': '🏖️', 'travel': '🏖️',
    'education': '🎓', 'school': '🎓', 'college': '🎓',
    'emergency': '🛡️',
    'wedding': '💍', 'ring': '💍',
    'gadget': '📱', 'phone': '📱', 'laptop': '📱',
    'retirement': '🌴', 'retire': '🌴'
  };

  txForm;

  constructor(private api: ApiService, private fb: FormBuilder, private exportSvc: ExportService) {
    this.txForm = this.fb.group({
      category: [''],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  canSubmit(): boolean {
    if (this.txForm.controls.amount.invalid) return false;
    if (this.modalType === 'Income') return !!this.txForm.value.category;
    return !!this.txForm.value.category || !!this.selectedGoalId;
  }

  pickCategory(cat: string) {
    this.txForm.patchValue({ category: cat });
    this.selectedGoalId = null;
  }

  pickGoal(id: string) {
    this.selectedGoalId = this.selectedGoalId === id ? null : id;
    if (this.selectedGoalId) this.txForm.patchValue({ category: '' });
  }

  clearCategory() {
    this.txForm.patchValue({ category: '' });
  }

  ngOnInit() {
    this.loadAll();
  }

  netMtd(): number {
    return (this.overview?.incomeMtd ?? 0) - (this.overview?.expensesMtd ?? 0);
  }

  savingsRate(): number {
    const inc = this.overview?.incomeMtd ?? 0;
    const exp = this.overview?.expensesMtd ?? 0;
    if (inc <= 0) return 0;
    return Math.round(((inc - exp) / inc) * 100);
  }

  recentTransactions(): Transaction[] {
    return [...this.transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5);
  }

  topGoals(): Goal[] {
    return [...this.goals]
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 2);
  }

  private loadAll() {
    const safe = <T>(o: any, fb: T) => (o as any).pipe(catchError(() => of(fb)));
    forkJoin({
      dashboard: safe(this.api.getDashboard(), null),
      overview: safe(this.api.getPfmOverview(), null),
      transactions: safe(this.api.getTransactions(), []),
      goals: safe(this.api.getGoals(), [])
    }).subscribe((res: any) => {
      this.data = res.dashboard;
      this.overview = res.overview;
      this.transactions = res.transactions ?? [];
      this.goals = res.goals ?? [];
    });
  }

  openModal(type: 'Expense' | 'Income') {
    this.modalType = type;
    this.txForm.reset({ category: '', amount: null, description: '' });
    this.selectedGoalId = null;
    this.txError = '';
    this.showModal = true;
  }
  closeModal() { this.showModal = false; }

  toggleAssetMenu(ev: MouseEvent) {
    ev.stopPropagation();
    this.showAssetMenu = !this.showAssetMenu;
    if (this.showAssetMenu) {
      const close = () => { this.showAssetMenu = false; document.removeEventListener('click', close); };
      setTimeout(() => document.addEventListener('click', close), 0);
    }
  }

  selectedGoalName(): string {
    return this.goals.find(g => g.id === this.selectedGoalId)?.name ?? '';
  }

  getGoalEmojiForName(name: string): string {
    const lower = (name || '').toLowerCase();
    for (const key of Object.keys(this.goalEmojiMap)) {
      if (lower.includes(key)) return this.goalEmojiMap[key];
    }
    return '🎯';
  }

  submitTransaction() {
    if (!this.canSubmit()) return;
    this.txSaving = true;
    this.txError = '';
    const { category, amount, description } = this.txForm.value;
    const goalId = this.selectedGoalId;
    const goal = goalId ? this.goals.find(g => g.id === goalId) : null;
    const txCategory = goal ? goal.name : (category ?? '');

    this.api.createTransaction({
      type: this.modalType,
      category: txCategory,
      amount: amount!,
      description: description ?? '',
      date: new Date().toISOString()
    }).subscribe({
      next: () => {
        const finish = () => {
          this.txSaving = false;
          this.showModal = false;
          this.showSuccessToast();
          this.loadAll();
        };
        if (goalId && amount) {
          this.api.contributeToGoal(goalId, amount).subscribe({
            next: () => finish(),
            error: () => finish()
          });
        } else {
          finish();
        }
      },
      error: (err) => {
        this.txError = err.error?.error || 'Failed to save transaction. Please try again.';
        this.txSaving = false;
      }
    });
  }

  downloadExcel() {
    if (this.downloading) return;
    this.downloading = true;
    this.downloadError = '';
    this.exportSvc.exportAllAsExcel().subscribe({
      next: () => {
        this.downloading = false;
        this.showExportToast = true;
        setTimeout(() => this.showExportToast = false, 2500);
      },
      error: () => {
        this.downloading = false;
        this.downloadError = 'Could not generate export. Please try again.';
      }
    });
  }

  getAssetRoute(type: string): string {
    switch (type) {
      case 'Stock': return '/stocks';
      case 'Crypto': return '/crypto';
      default: return '/dashboard';
    }
  }

  getAssetEmoji(type: string): string {
    switch (type) {
      case 'Savings': return '💰';
      case 'Stock': return '📈';
      case 'Crypto': return '₿';
      default: return '💰';
    }
  }

  buildSparklinePath(data: number[]): string {
    if (!data || data.length < 2) return '';
    const width = 80;
    const height = 48;
    const padding = 5;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = (width - padding * 2) / (data.length - 1);
    return data.map((val, i) => {
      const x = padding + i * stepX;
      const y = padding + ((max - val) / range) * (height - padding * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  private showSuccessToast() {
    this.toastType = this.modalType;
    this.toastMessage = `${this.modalType} added successfully!`;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }
}
