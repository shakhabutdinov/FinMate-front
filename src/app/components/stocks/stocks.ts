import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { StockPortfolio, AlpacaAccountData, AlpacaPosition, AlpacaBar } from '../../models/api.models';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainLayoutComponent, CurrencyPipe, BaseChartDirective],
  template: `
    <app-main-layout pageTitle="Stock Portfolio" activePage="stocks">
      <div class="h-full flex flex-col text-white overflow-hidden">
        @if (loading) {
          <div class="flex-1 flex items-center justify-center">
            <div class="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (!alpacaData || !alpacaData.isConnected) {
          <!-- Not Connected -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <div class="flex flex-col items-center justify-center pt-8 pb-4">
              <div class="w-20 h-20 rounded-2xl bg-[#00FF88]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-10 text-[#00FF88]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-2">Alpaca Not Connected</h2>
              <p class="text-gray-400 text-sm text-center px-6 mb-6">Connect your Alpaca brokerage account to view your stock positions in real time.</p>
            </div>

            <div class="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
              <h3 class="text-white font-semibold mb-4">Connect Your Account</h3>
              <form [formGroup]="connectForm" (ngSubmit)="onConnect()" class="space-y-3">
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">API Key ID</label>
                  <input type="text" formControlName="apiKey" placeholder="Enter your Alpaca API Key ID"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all">
                </div>
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Secret Key</label>
                  <input type="password" formControlName="secretKey" placeholder="Enter your Alpaca Secret Key"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 focus:border-[#00FF88]/50 transition-all">
                </div>
                <div class="flex items-center gap-2 pt-1">
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" formControlName="isPaper" class="sr-only peer">
                    <div class="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00FF88]"></div>
                  </label>
                  <span class="text-gray-400 text-xs">Paper Trading Account</span>
                </div>
                @if (error) {
                  <div class="text-red-400 text-sm">{{ error }}</div>
                }
                <button type="submit" [disabled]="connectForm.invalid || connecting"
                  class="w-full h-11 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black rounded-lg transition-colors font-medium text-sm disabled:opacity-50 mt-2">
                  {{ connecting ? 'Connecting...' : 'Connect Alpaca' }}
                </button>
              </form>
            </div>

            <div class="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-4">
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div class="text-xs text-gray-400 leading-relaxed">
                  <p class="font-medium text-gray-300 mb-1">How to get your API keys:</p>
                  <ol class="list-decimal list-inside space-y-0.5">
                    <li>Go to <span class="text-[#00FF88]">alpaca.markets</span> and sign in</li>
                    <li>Navigate to Paper Trading &gt; API Keys</li>
                    <li>Click <span class="text-[#00FF88]">Generate</span> to create a new key pair</li>
                    <li>Copy both API Key ID and Secret Key above</li>
                  </ol>
                </div>
              </div>
            </div>

            <!-- Manual Holdings below -->
            @if (data) {
              <div class="space-y-3 pt-2">
                <h3 class="text-gray-400 text-sm font-medium px-1">Manual Holdings</h3>
                @for (holding of data.holdings; track holding.id) {
                  <div class="w-full flex items-center justify-between p-3 bg-gray-900/50 rounded-2xl border border-transparent">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" [style.background-color]="holding.color" [style.color]="getTextColor(holding.color)">
                        {{ holding.symbol[0] }}
                      </div>
                      <div class="text-left">
                        <div class="font-medium text-white">{{ holding.companyName }}</div>
                        <div class="text-xs text-gray-400">{{ holding.pricePerShare | currency:'USD' }}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="font-medium text-white">{{ holding.totalValue | currency:'USD':'symbol':'1.0-0' }}</div>
                      <div class="text-xs text-gray-400">{{ holding.quantity }} sh</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <!-- Connected - Alpaca Dashboard -->
          <div class="flex-1 overflow-y-auto pb-20">
            <div class="p-4 space-y-5">

              <!-- Account Summary -->
              <div class="text-center space-y-1 py-4">
                <div class="flex items-center justify-center gap-3">
                  <h2 class="text-gray-400 text-sm">Portfolio Equity</h2>
                  @if (alpacaData.isPaper) {
                    <span class="text-[10px] font-medium bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">PAPER</span>
                  }
                  <button (click)="showLogoutConfirm = true" class="text-gray-500 hover:text-red-400 transition-colors" title="Disconnect Alpaca">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="text-4xl font-bold text-white">{{ alpacaData.equity | currency:'USD':'symbol':'1.2-2' }}</div>
                <div class="flex items-center justify-center gap-4 text-xs text-gray-400 pt-1">
                  <span>Cash: <span class="text-white font-medium">{{ alpacaData.cash | currency:'USD':'symbol':'1.2-2' }}</span></span>
                  <span>Buying Power: <span class="text-white font-medium">{{ alpacaData.buyingPower | currency:'USD':'symbol':'1.2-2' }}</span></span>
                </div>
              </div>

              <!-- Logout Confirmation -->
              @if (showLogoutConfirm) {
                <div class="bg-gray-900/80 border border-red-500/30 rounded-2xl p-4">
                  <p class="text-white text-sm font-medium mb-3 text-center">Disconnect Alpaca account?</p>
                  <div class="flex gap-3">
                    <button (click)="showLogoutConfirm = false" class="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl transition-colors font-medium">
                      No
                    </button>
                    <button (click)="disconnect()" class="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-xl transition-colors font-medium border border-red-500/30">
                      Yes, Disconnect
                    </button>
                  </div>
                </div>
              }

              <!-- Positions -->
              @if (alpacaData.positions.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">Your Positions</h3>
                  @for (pos of alpacaData.positions; track pos.symbol) {
                    <button
                      (click)="selectPosition(pos)"
                      class="w-full flex items-center justify-between p-3 rounded-2xl transition-all border"
                      [class]="selectedPosition?.symbol === pos.symbol
                        ? 'bg-gray-800/60 border-[#00FF88]/30'
                        : 'bg-gray-900/50 hover:bg-gray-800/60 border-transparent hover:border-[#00FF88]/20'">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                             [style.background-color]="getSymbolBgColor(pos.symbol)"
                             [style.color]="getSymbolTextColor(pos.symbol)">
                          {{ pos.symbol.charAt(0) }}
                        </div>
                        <div class="text-left">
                          <div class="font-medium">{{ pos.symbol }}</div>
                          <div class="text-xs text-gray-400">{{ pos.qty }} shares @ {{ pos.avgEntryPrice | currency:'USD' }}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-medium">{{ pos.marketValue | currency:'USD':'symbol':'1.2-2' }}</div>
                        <div class="text-xs" [class]="pos.unrealizedPl >= 0 ? 'text-[#00FF88]' : 'text-red-400'">
                          {{ pos.unrealizedPl >= 0 ? '+' : '' }}{{ pos.unrealizedPl | currency:'USD':'symbol':'1.2-2' }}
                          ({{ pos.unrealizedPlPc >= 0 ? '+' : '' }}{{ (pos.unrealizedPlPc * 100) | number:'1.2-2' }}%)
                        </div>
                      </div>
                    </button>
                  }
                </div>
              } @else {
                <div class="text-center py-8">
                  <p class="text-gray-500 text-sm">No open positions</p>
                </div>
              }

              <!-- Price Chart -->
              @if (selectedPosition) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between px-1">
                    <h3 class="text-gray-400 text-sm font-medium">{{ selectedPosition.symbol }} Price (30d)</h3>
                    @if (chartLoading) {
                      <div class="w-4 h-4 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
                    }
                  </div>
                  <div class="bg-gray-900/50 rounded-2xl p-3 border border-gray-800">
                    @if (!chartLoading && lineChartData.datasets[0].data.length > 0) {
                      <div style="height: 200px; position: relative;">
                        <canvas baseChart
                          [data]="lineChartData"
                          [options]="lineChartOptions"
                          [type]="'line'">
                        </canvas>
                      </div>
                    } @else if (!chartLoading) {
                      <div class="h-[200px] flex items-center justify-center text-gray-500 text-sm">
                        No chart data available
                      </div>
                    } @else {
                      <div class="h-[200px] flex items-center justify-center">
                        <div class="w-6 h-6 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Trending -->
              @if (data && data.trending.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">Trending</h3>
                  <div class="grid grid-cols-2 gap-3">
                    @for (item of data.trending; track item.symbol) {
                      <div class="bg-gray-900/50 p-3 rounded-xl border border-gray-800">
                        <div class="flex justify-between items-start mb-2">
                          <div class="font-medium text-sm text-white">{{ item.symbol }}</div>
                          <div class="text-xs" [class]="item.changePercent >= 0 ? 'text-[#00FF88]' : 'text-red-500'">
                            {{ item.changePercent >= 0 ? '+' : '' }}{{ item.changePercent }}%
                          </div>
                        </div>
                        <div class="h-10 flex items-end gap-0.5">
                          @for (val of item.chartData; track $index) {
                            <div class="flex-1 rounded-t" [style.height.%]="getBarHeight(val, item.chartData)" [style.background-color]="item.changePercent >= 0 ? '#00FF88' : '#ef4444'" [style.opacity]="0.4 + ($index / item.chartData.length) * 0.6"></div>
                          }
                        </div>
                        <div class="mt-2 text-xs text-gray-400">{{ item.price | currency:'USD' }}</div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `
})
export class StocksComponent implements OnInit {
  data: StockPortfolio | null = null;
  alpacaData: AlpacaAccountData | null = null;
  loading = true;
  connecting = false;
  error = '';
  showLogoutConfirm = false;
  selectedPosition: AlpacaPosition | null = null;
  chartLoading = false;
  connectForm;

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      borderColor: '#00FF88',
      backgroundColor: 'rgba(0, 255, 136, 0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#00FF88',
      borderWidth: 2
    }]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#9ca3af',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `$${Number(ctx.raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 6 }
      },
      y: {
        display: true,
        position: 'right',
        grid: { color: 'rgba(75,85,99,0.2)' },
        ticks: {
          color: '#6b7280',
          font: { size: 10 },
          callback: (val) => '$' + Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 })
        }
      }
    }
  };

  private symbolColors: Record<string, { bg: string; text: string }> = {
    AAPL:  { bg: 'rgba(0,122,255,0.125)',   text: 'rgb(0,122,255)' },
    TSLA:  { bg: 'rgba(227,25,55,0.125)',    text: 'rgb(227,25,55)' },
    NVDA:  { bg: 'rgba(118,185,0,0.125)',    text: 'rgb(118,185,0)' },
    MSFT:  { bg: 'rgba(0,120,215,0.125)',    text: 'rgb(0,120,215)' },
    AMZN:  { bg: 'rgba(255,153,0,0.125)',    text: 'rgb(255,153,0)' },
    GOOGL: { bg: 'rgba(66,133,244,0.125)',   text: 'rgb(66,133,244)' },
    META:  { bg: 'rgba(24,119,242,0.125)',   text: 'rgb(24,119,242)' },
    AMD:   { bg: 'rgba(0,128,0,0.125)',      text: 'rgb(0,128,0)' },
    NFLX:  { bg: 'rgba(229,9,20,0.125)',     text: 'rgb(229,9,20)' },
    DIS:   { bg: 'rgba(0,99,191,0.125)',     text: 'rgb(0,99,191)' },
    SPY:   { bg: 'rgba(255,200,0,0.125)',    text: 'rgb(255,200,0)' },
    QQQ:   { bg: 'rgba(0,168,107,0.125)',    text: 'rgb(0,168,107)' },
  };

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.connectForm = this.fb.group({
      apiKey: ['', [Validators.required, Validators.minLength(10)]],
      secretKey: ['', [Validators.required, Validators.minLength(10)]],
      isPaper: [true]
    });
  }

  ngOnInit() {
    this.api.getStockPortfolio().subscribe(data => this.data = data);

    this.api.getAlpacaStatus().subscribe({
      next: (status) => {
        if (status.isConnected) {
          this.loadAccountData();
        } else {
          this.loading = false;
        }
      },
      error: () => this.loading = false
    });
  }

  onConnect() {
    if (this.connectForm.invalid) return;
    this.connecting = true;
    this.error = '';
    const { apiKey, secretKey, isPaper } = this.connectForm.value;
    this.api.connectAlpaca(apiKey!, secretKey!, isPaper ?? true).subscribe({
      next: (data) => {
        this.alpacaData = data;
        this.connecting = false;
        if (data.positions.length > 0) {
          this.selectPosition(data.positions[0]);
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Failed to connect. Check your API keys.';
        this.connecting = false;
      }
    });
  }

  disconnect() {
    this.showLogoutConfirm = false;
    this.api.disconnectAlpaca().subscribe(() => {
      this.alpacaData = null;
      this.selectedPosition = null;
    });
  }

  selectPosition(pos: AlpacaPosition) {
    this.selectedPosition = pos;
    this.loadBars(pos.symbol);
  }

  getSymbolBgColor(symbol: string): string {
    return this.symbolColors[symbol]?.bg || 'rgba(107,114,128,0.125)';
  }

  getSymbolTextColor(symbol: string): string {
    return this.symbolColors[symbol]?.text || 'rgb(107,114,128)';
  }

  getTextColor(bgColor: string): string {
    const match = bgColor.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgb(${match[0]}, ${match[1]}, ${match[2]})`;
    }
    return '#00FF88';
  }

  getBarHeight(val: number, data: number[]): number {
    const max = Math.max(...data);
    const min = Math.min(...data);
    if (max === min) return 50;
    return 20 + ((val - min) / (max - min)) * 80;
  }

  private loadAccountData() {
    this.api.getAlpacaAccount().subscribe({
      next: (data) => {
        this.alpacaData = data;
        this.loading = false;
        if (data.positions.length > 0) {
          this.selectPosition(data.positions[0]);
        }
      },
      error: () => this.loading = false
    });
  }

  private loadBars(symbol: string) {
    this.chartLoading = true;
    this.api.getAlpacaBars(symbol, '1Day', 30).subscribe({
      next: (bars) => {
        const labels = bars.map(b => {
          const d = new Date(b.time);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        const data = bars.map(b => b.close);

        this.lineChartData = {
          labels,
          datasets: [{
            data,
            borderColor: '#00FF88',
            backgroundColor: 'rgba(0, 255, 136, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: '#00FF88',
            borderWidth: 2
          }]
        };
        this.chartLoading = false;
      },
      error: () => this.chartLoading = false
    });
  }
}
