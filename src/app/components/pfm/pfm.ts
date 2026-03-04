import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { PfmOverview, Transaction, Goal } from '../../models/api.models';

@Component({
  selector: 'app-pfm',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainLayoutComponent, CurrencyPipe],
  template: `
    <app-main-layout pageTitle="Personal Finance" activePage="pfm">
      <div class="flex flex-col h-full">
        <!-- Tabs -->
        <div class="p-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-800">
          <h1 class="text-xl font-bold mb-4 text-white">Financial Overview</h1>
          <div class="flex gap-2">
            @for (tab of tabs; track tab) {
              <button (click)="activeTab = tab" class="flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all" [class]="activeTab === tab ? 'bg-[#00FF88] text-black shadow-lg shadow-[#00FF88]/20' : 'bg-gray-800 text-gray-400 hover:text-white'">
                {{ tab }}
              </button>
            }
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-4 space-y-6">
          @if (activeTab === 'Overview' && overview) {
            <!-- Income/Expense Cards -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                <div class="flex items-center gap-2 mb-2 text-gray-400 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                  INCOME (MTD)
                </div>
                <div class="text-xl font-bold text-white">{{ overview.incomeMtd | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
              <div class="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
                <div class="flex items-center gap-2 mb-2 text-gray-400 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7 7 17"/><path d="M17 17H7V7"/></svg>
                  EXPENSES (MTD)
                </div>
                <div class="text-xl font-bold text-white">{{ overview.expensesMtd | currency:'USD':'symbol':'1.2-2' }}</div>
              </div>
            </div>

            <!-- Cashflow Chart -->
            <div class="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
              <h3 class="font-semibold flex items-center gap-2 mb-4 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                Cashflow
              </h3>
              <div class="h-48 flex items-end gap-2">
                @for (item of overview.cashflowData; track item.month) {
                  <div class="flex-1 flex flex-col items-center gap-1">
                    <div class="w-full flex gap-1 items-end" style="height: 160px">
                      <div class="flex-1 bg-[#00FF88] rounded-t" [style.height.%]="getBarPct(item.income, maxCashflow)"></div>
                      <div class="flex-1 bg-red-500 rounded-t" [style.height.%]="getBarPct(item.expenses, maxCashflow)"></div>
                    </div>
                    <span class="text-xs text-gray-500">{{ item.month }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Expense Segments -->
            <div class="bg-gray-900/50 p-4 rounded-2xl border border-gray-800">
              <h3 class="font-semibold mb-4 flex items-center gap-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>
                Expense Segments
              </h3>
              <div class="flex items-center gap-4">
                <div class="h-40 w-40 flex-shrink-0 relative">
                  <div class="w-full h-full rounded-full" style="background: conic-gradient(#00FF88 0% 48%, #00CC6A 48% 66%, #009950 66% 78%, #006635 78% 86%, #004422 86% 100%)"></div>
                  <div class="absolute inset-0 flex items-center justify-center flex-col">
                    <div class="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center flex-col">
                      <span class="text-xs text-gray-400">Total</span>
                      <span class="font-bold text-sm text-white">{{ overview.totalExpenses | currency:'USD':'symbol':'1.0-0' }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex-1 space-y-2">
                  @for (seg of overview.expenseSegments; track seg.category) {
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full" [style.background-color]="seg.color"></div>
                        <span class="text-gray-300">{{ seg.category }}</span>
                      </div>
                      <span class="font-medium text-white">{{ seg.amount | currency:'USD':'symbol':'1.0-0' }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }

          @if (activeTab === 'Transactions') {
            <div class="space-y-3">
              @for (tx of transactions; track tx.id) {
                <div class="flex items-center justify-between p-3 bg-gray-900/50 rounded-2xl border border-gray-800">
                  <div>
                    <div class="font-medium text-white">{{ tx.category }}</div>
                    <div class="text-xs text-gray-400">{{ tx.description }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium" [class]="tx.type === 'Income' ? 'text-[#00FF88]' : 'text-red-400'">
                      {{ tx.type === 'Income' ? '+' : '-' }}{{ tx.amount | currency:'USD' }}
                    </div>
                    <div class="text-xs text-gray-400">{{ tx.date | date:'MMM d' }}</div>
                  </div>
                </div>
              }
            </div>
          }

          @if (activeTab === 'Goals') {
            <!-- Header with Add New -->
            <div class="flex items-center justify-between">
              <h2 class="text-white font-semibold text-lg">Savings Goals</h2>
              <button (click)="openGoalModal()" class="flex items-center gap-1 text-[#00FF88] text-sm font-medium hover:text-[#00FF88]/80 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Add New
              </button>
            </div>

            <div class="space-y-4">
              @for (goal of goals; track goal.id) {
                <div class="p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                  <div class="flex items-start gap-3 mb-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl flex-shrink-0">
                      {{ getGoalEmoji(goal.name) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between">
                        <span class="font-medium text-white">{{ goal.name }}</span>
                        <span class="text-sm font-semibold text-[#00FF88]">{{ goal.progressPercent }}%</span>
                      </div>
                      <div class="text-xs text-gray-400 mt-0.5">Target: {{ goal.targetAmount | currency:'USD':'symbol':'1.0-0' }}</div>
                    </div>
                  </div>
                  <div class="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <div class="h-full bg-[#00FF88] rounded-full transition-all duration-500" [style.width.%]="goal.progressPercent"></div>
                  </div>
                  <div class="flex justify-between mt-2 text-xs text-gray-400">
                    <span>{{ goal.currentAmount | currency:'USD':'symbol':'1.0-0' }} saved</span>
                    <span>{{ (goal.targetAmount - goal.currentAmount) | currency:'USD':'symbol':'1.0-0' }} left</span>
                  </div>
                </div>
              }
              @if (goals.length === 0) {
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-16 h-16 rounded-2xl bg-[#00FF88]/10 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FF88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                  </div>
                  <p class="text-gray-400 text-sm mb-4">No goals yet. Start saving towards something!</p>
                  <button (click)="openGoalModal()" class="px-4 py-2 bg-[#00FF88] text-black rounded-xl text-sm font-medium hover:bg-[#00FF88]/90 transition-colors">
                    Create Your First Goal
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Add Goal Modal -->
      @if (showGoalModal) {
        <div class="fixed inset-0 z-50 flex items-end justify-center" (click)="closeGoalModal()">
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div class="relative w-full max-w-[430px] bg-gray-900 border-t border-gray-700 rounded-t-3xl p-5 pb-8 animate-slide-up" (click)="$event.stopPropagation()">
            <!-- Handle -->
            <div class="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-5"></div>

            <!-- Header -->
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-bold text-white">New Savings Goal</h2>
              <button (click)="closeGoalModal()" class="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <!-- Preset Categories -->
            <div class="mb-4">
              <label class="text-gray-400 text-xs mb-2 block">Choose a category</label>
              <div class="grid grid-cols-4 gap-2">
                @for (preset of goalPresets; track preset.name) {
                  <button
                    (click)="selectGoalPreset(preset)"
                    class="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all"
                    [class]="goalForm.value.name === preset.name
                      ? 'bg-[#00FF88]/10 border-[#00FF88]/40 text-white'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600'">
                    <span class="text-xl">{{ preset.emoji }}</span>
                    <span class="text-[10px] font-medium leading-tight text-center">{{ preset.name }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Custom Name -->
            <div class="mb-4">
              <label class="text-gray-400 text-xs mb-1 block">Goal Name</label>
              <input type="text" [formControl]="goalForm.controls.name" placeholder="e.g. New Car"
                class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all">
            </div>

            <!-- Target Amount -->
            <div class="mb-4">
              <label class="text-gray-400 text-xs mb-1 block">Target Amount</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input type="number" [formControl]="goalForm.controls.targetAmount" placeholder="0.00"
                  class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all">
              </div>
            </div>

            <!-- Starting Amount -->
            <div class="mb-4">
              <label class="text-gray-400 text-xs mb-1 block">Already Saved (optional)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <input type="number" [formControl]="goalForm.controls.currentAmount" placeholder="0.00"
                  class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg pl-7 pr-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all">
              </div>
            </div>

            <!-- Deadline -->
            <div class="mb-5">
              <label class="text-gray-400 text-xs mb-1 block">Target Date (optional)</label>
              <input type="date" [formControl]="goalForm.controls.deadline"
                class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all [color-scheme:dark]">
            </div>

            @if (goalError) {
              <div class="text-red-400 text-sm mb-3">{{ goalError }}</div>
            }

            <button
              (click)="submitGoal()"
              [disabled]="goalForm.controls.name.invalid || goalForm.controls.targetAmount.invalid || goalSaving"
              class="w-full h-12 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black rounded-xl font-medium text-sm transition-all disabled:opacity-50">
              @if (goalSaving) {
                <div class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
              } @else {
                Create Goal
              }
            </button>
          </div>
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
export class PfmComponent implements OnInit {
  tabs = ['Overview', 'Transactions', 'Goals'];
  activeTab = 'Overview';
  overview: PfmOverview | null = null;
  transactions: Transaction[] = [];
  goals: Goal[] = [];
  maxCashflow = 0;

  showGoalModal = false;
  goalSaving = false;
  goalError = '';
  goalForm;

  goalPresets = [
    { name: 'New Car', emoji: '🚗' },
    { name: 'House', emoji: '🏠' },
    { name: 'Vacation', emoji: '🏖️' },
    { name: 'Education', emoji: '🎓' },
    { name: 'Emergency', emoji: '🛡️' },
    { name: 'Wedding', emoji: '💍' },
    { name: 'Gadget', emoji: '📱' },
    { name: 'Retirement', emoji: '🌴' }
  ];

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.goalForm = this.fb.group({
      name: ['', Validators.required],
      targetAmount: [null as number | null, [Validators.required, Validators.min(1)]],
      currentAmount: [0],
      deadline: ['']
    });
  }

  ngOnInit() {
    this.api.getPfmOverview().subscribe(data => {
      this.overview = data;
      this.maxCashflow = Math.max(...data.cashflowData.flatMap(d => [d.income, d.expenses]));
    });
    this.api.getTransactions().subscribe(data => this.transactions = data);
    this.api.getGoals().subscribe(data => this.goals = data);
  }

  openGoalModal() {
    this.goalForm.reset({ currentAmount: 0 });
    this.goalError = '';
    this.showGoalModal = true;
  }

  closeGoalModal() {
    this.showGoalModal = false;
  }

  selectGoalPreset(preset: { name: string; emoji: string }) {
    this.goalForm.patchValue({ name: preset.name });
  }

  submitGoal() {
    if (this.goalForm.controls.name.invalid || this.goalForm.controls.targetAmount.invalid) return;
    this.goalSaving = true;
    this.goalError = '';

    const { name, targetAmount, currentAmount, deadline } = this.goalForm.value;
    this.api.createGoal({
      name: name!,
      targetAmount: targetAmount!,
      currentAmount: currentAmount || 0,
      deadline: deadline || undefined
    }).subscribe({
      next: (goal) => {
        this.goals.push(goal);
        this.goalSaving = false;
        this.showGoalModal = false;
      },
      error: (err) => {
        this.goalError = err.error?.error || 'Failed to create goal.';
        this.goalSaving = false;
      }
    });
  }

  getGoalEmoji(name: string): string {
    const preset = this.goalPresets.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (preset) return preset.emoji;
    const lower = name.toLowerCase();
    if (lower.includes('car') || lower.includes('auto')) return '🚗';
    if (lower.includes('house') || lower.includes('home') || lower.includes('apartment')) return '🏠';
    if (lower.includes('vacation') || lower.includes('trip') || lower.includes('travel')) return '🏖️';
    if (lower.includes('education') || lower.includes('school') || lower.includes('college')) return '🎓';
    if (lower.includes('emergency') || lower.includes('safety')) return '🛡️';
    if (lower.includes('wedding') || lower.includes('ring')) return '💍';
    if (lower.includes('phone') || lower.includes('laptop') || lower.includes('gadget')) return '📱';
    if (lower.includes('retire')) return '🌴';
    return '🎯';
  }

  getBarPct(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }
}
