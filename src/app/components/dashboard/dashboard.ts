import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { DashboardData } from '../../models/api.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent, CurrencyPipe, DecimalPipe],
  template: `
    <app-main-layout pageTitle="Dashboard" activePage="main">
      @if (data) {
        <div class="p-4 space-y-6">
          <!-- Balance Card -->
          <div class="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-3xl p-5 border border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <h1 class="text-gray-400 text-sm">Total Balance</h1>
              <div class="flex items-center gap-2">
                <button (click)="balanceVisible = !balanceVisible" class="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                  @if (balanceVisible) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>
                  }
                </button>
              </div>
            </div>
            <div class="mb-4">
              <p class="text-4xl text-white font-bold mb-2">
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
            <div class="grid grid-cols-3 gap-2">
              <button class="inline-flex items-center justify-center gap-1 py-2 px-2 bg-gray-700/50 hover:bg-gray-700 text-white border border-gray-600 h-10 text-xs rounded-md font-medium transition-all">
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
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-3 gap-3">
            @for (action of data.quickActions; track action.name) {
              <button class="flex flex-col items-center justify-center p-3 bg-gray-800/40 border border-gray-700 hover:bg-gray-700/50 rounded-xl transition-all group">
                <div class="p-2 bg-[#00FF88]/10 rounded-lg mb-2 group-hover:bg-[#00FF88]/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                </div>
                <span class="text-xs font-medium text-gray-300 text-center">{{ action.name }}</span>
              </button>
            }
          </div>

          <!-- Assets -->
          <div>
            <h2 class="text-gray-400 text-sm mb-3">Your Assets</h2>
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
        </div>

        <!-- Transaction Modal Overlay -->
        @if (showModal) {
          <div class="fixed inset-0 z-50 flex items-end justify-center" (click)="closeModal()">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            <div class="relative w-full max-w-[430px] bg-gray-900 border-t border-gray-700 rounded-t-3xl p-5 pb-8 animate-slide-up" (click)="$event.stopPropagation()">
              <!-- Handle -->
              <div class="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5"></div>

              <!-- Header -->
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-lg font-bold text-white">
                  {{ modalType === 'Expense' ? 'Add Expense' : 'Add Income' }}
                </h2>
                <button (click)="closeModal()" class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>

              <!-- Category Selection -->
              <div class="mb-4">
                <label class="text-gray-400 text-xs mb-2 block">Category</label>
                <div class="flex flex-wrap gap-2">
                  @for (cat of (modalType === 'Expense' ? expenseCategories : incomeCategories); track cat) {
                    <button
                      (click)="txForm.patchValue({ category: cat })"
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

              <!-- Amount -->
              <div class="mb-4">
                <label class="text-gray-400 text-xs mb-1 block">Amount</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input type="number" [formControl]="txForm.controls.amount" placeholder="0.00"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg pl-7 pr-3 focus:outline-none focus:ring-2 transition-all"
                    [class]="modalType === 'Expense' ? 'focus:ring-red-500/50 focus:border-red-500/50' : 'focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50'">
                </div>
              </div>

              <!-- Description -->
              <div class="mb-5">
                <label class="text-gray-400 text-xs mb-1 block">Description</label>
                <input type="text" [formControl]="txForm.controls.description" placeholder="What was this for?"
                  class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 transition-all"
                  [class]="modalType === 'Expense' ? 'focus:ring-red-500/50 focus:border-red-500/50' : 'focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50'">
              </div>

              <!-- Submit -->
              @if (txError) {
                <div class="text-red-400 text-sm mb-3">{{ txError }}</div>
              }
              <button
                (click)="submitTransaction()"
                [disabled]="txForm.invalid || txSaving"
                class="w-full h-12 rounded-xl font-medium text-sm transition-all disabled:opacity-50"
                [class]="modalType === 'Expense'
                  ? 'bg-red-500 hover:bg-red-500/90 text-white'
                  : 'bg-[#00FF88] hover:bg-[#00FF88]/90 text-black'">
                @if (txSaving) {
                  <div class="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto"></div>
                } @else {
                  {{ modalType === 'Expense' ? 'Add Expense' : 'Add Income' }}
                }
              </button>
            </div>
          </div>
        }

        <!-- Success Toast -->
        @if (showToast) {
          <div class="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-[380px] w-full px-4">
            <div class="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-xl"
              [class]="toastType === 'Income'
                ? 'bg-[#00FF88]/10 border-[#00FF88]/30'
                : 'bg-red-500/10 border-red-500/30'">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                [class]="toastType === 'Income' ? 'bg-[#00FF88]/20' : 'bg-red-500/20'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  [class]="toastType === 'Income' ? 'text-[#00FF88]' : 'text-red-400'"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <span class="text-sm font-medium text-white">{{ toastMessage }}</span>
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
    .animate-slide-up {
      animation: slideUp 0.3s ease-out;
    }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  balanceVisible = true;

  showModal = false;
  modalType: 'Expense' | 'Income' = 'Expense';
  txSaving = false;
  txError = '';

  showToast = false;
  toastMessage = '';
  toastType: 'Expense' | 'Income' = 'Income';

  expenseCategories = ['Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];
  incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other'];

  txForm;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.txForm = this.fb.group({
      category: ['', Validators.required],
      amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.api.getDashboard().subscribe(data => this.data = data);
  }

  openModal(type: 'Expense' | 'Income') {
    this.modalType = type;
    this.txForm.reset();
    this.txError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitTransaction() {
    if (this.txForm.invalid) return;
    this.txSaving = true;
    this.txError = '';

    const { category, amount, description } = this.txForm.value;
    this.api.createTransaction({
      type: this.modalType,
      category: category!,
      amount: amount!,
      description: description!,
      date: new Date().toISOString()
    }).subscribe({
      next: () => {
        this.txSaving = false;
        this.showModal = false;
        this.showSuccessToast();
        this.api.getDashboard().subscribe(data => this.data = data);
      },
      error: (err) => {
        this.txError = err.error?.error || 'Failed to save transaction. Please try again.';
        this.txSaving = false;
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
