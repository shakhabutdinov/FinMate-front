import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { StockPortfolio, AlpacaAccountData, AlpacaPosition, AlpacaBar, OrderSummary, OrderResult } from '../../models/api.models';

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

          <!-- ── NOT CONNECTED ─────────────────────────────────────────── -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <div class="flex flex-col items-center justify-center pt-8 pb-4">
              <div class="w-20 h-20 rounded-2xl bg-[#00FF88]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-10 text-[#00FF88]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                  <polyline points="16 7 22 7 22 13"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-2">Alpaca Not Connected</h2>
              <p class="text-gray-400 text-sm text-center px-6 mb-6">Connect your Alpaca brokerage account to trade stocks and view your positions in real time.</p>
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
          </div>

        } @else {

          <!-- ── CONNECTED ─────────────────────────────────────────────── -->
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

              <!-- Disconnect Confirm -->
              @if (showLogoutConfirm) {
                <div class="bg-gray-900/80 border border-red-500/30 rounded-2xl p-4">
                  <p class="text-white text-sm font-medium mb-3 text-center">Disconnect Alpaca account?</p>
                  <div class="flex gap-3">
                    <button (click)="showLogoutConfirm = false" class="flex-1 py-2 px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-xl transition-colors font-medium">No</button>
                    <button (click)="disconnect()" class="flex-1 py-2 px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded-xl transition-colors font-medium border border-red-500/30">Yes, Disconnect</button>
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
                  <p class="text-gray-500 text-sm">No open positions. Place a buy order below to get started.</p>
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
                      <div class="h-[200px] flex items-center justify-center text-gray-500 text-sm">No chart data available</div>
                    } @else {
                      <div class="h-[200px] flex items-center justify-center">
                        <div class="w-6 h-6 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    }
                  </div>
                </div>
              }


              <!-- ── TRADE PANEL ──────────────────────────── -->
              <div class="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 space-y-4">
                <h3 class="text-white font-semibold">Place Order</h3>

                <form [formGroup]="tradeForm" class="space-y-4">
                <!-- Symbol -->
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Symbol</label>
                  <input type="text" formControlName="symbol" placeholder="e.g. AAPL"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 uppercase focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all">
                </div>
                <!-- Buy / Sell -->
                <div class="flex rounded-xl overflow-hidden border border-gray-700">
                  <button type="button" (click)="setSide('buy')"
                    class="flex-1 py-2.5 text-sm font-medium transition-colors"
                    [class]="tradeSide === 'buy' ? 'bg-[#00FF88] text-black' : 'bg-gray-800/50 text-gray-400 hover:text-white'">
                    Buy
                  </button>
                  <button type="button" (click)="setSide('sell')"
                    class="flex-1 py-2.5 text-sm font-medium transition-colors"
                    [class]="tradeSide === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-800/50 text-gray-400 hover:text-white'">
                    Sell
                  </button>
                </div>
                <!-- Order type -->
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Order Type</label>
                  <select formControlName="type"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all">
                    <option value="market">Market</option>
                    <option value="limit">Limit</option>
                  </select>
                </div>
                <!-- Quantity -->
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Quantity (shares)</label>
                  <input type="number" formControlName="qty" min="0.001" step="1" placeholder="e.g. 5"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all">
                </div>
                @if (tradeForm.get('type')?.value === 'limit') {
                  <div>
                    <label class="text-gray-400 text-xs mb-1 block">Limit Price (USD)</label>
                    <input type="number" formControlName="limitPrice" min="0.01" step="0.01" placeholder="e.g. 180.00"
                      class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all">
                  </div>
                }
                <!-- Time in force -->
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Time in Force</label>
                  <select formControlName="timeInForce"
                    class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all">
                    <option value="day">Day (expires end of day)</option>
                    <option value="gtc">GTC (good till cancelled)</option>
                  </select>
                </div>
                </form>

                <!-- Error -->
                @if (tradeError) {
                  <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">{{ tradeError }}</div>
                }

                <!-- Success result -->
                @if (lastOrderResult) {
                  <div class="bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl p-3 space-y-1">
                    <p class="text-[#00FF88] text-xs font-semibold">Order submitted successfully</p>
                    <p class="text-gray-300 text-xs">{{ lastOrderResult.side | titlecase }} {{ lastOrderResult.qty }} × {{ lastOrderResult.symbol }} — {{ lastOrderResult.type | titlecase }}</p>
                    <p class="text-gray-400 text-xs">Status: <span class="text-white">{{ lastOrderResult.status }}</span></p>
                    @if (lastOrderResult.filledAvgPrice) {
                      <p class="text-gray-400 text-xs">Filled @ <span class="text-white">{{ lastOrderResult.filledAvgPrice | currency:'USD' }}</span></p>
                    }
                  </div>
                }

                <!-- Submit button -->
                <button type="button" (click)="placeOrder()" [disabled]="placingOrder || tradeForm.invalid"
                  class="w-full h-11 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                  [class]="tradeSide === 'buy'
                    ? 'bg-[#00FF88] hover:bg-[#00FF88]/90 text-black'
                    : 'bg-red-500 hover:bg-red-500/90 text-white'">
                  {{ placingOrder ? 'Placing Order...' : (tradeSide === 'buy' ? 'Buy ' : 'Sell ') + (tradeForm.get('symbol')?.value || '—') }}
                </button>
              </div>

              <!-- ── ORDER HISTORY ────────────────────────────────────── -->
              @if (orders.length > 0) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between px-1">
                    <h3 class="text-gray-400 text-sm font-medium">Recent Orders</h3>
                    <button (click)="loadOrders()" class="text-[#00FF88] text-xs hover:underline">Refresh</button>
                  </div>
                  @for (order of orders; track order.orderId) {
                    <div class="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                             [class]="order.side === 'buy' ? 'bg-[#00FF88]/15 text-[#00FF88]' : 'bg-red-500/15 text-red-400'">
                          {{ order.side === 'buy' ? 'B' : 'S' }}
                        </div>
                        <div>
                          <div class="text-white text-sm font-medium">{{ order.symbol }}</div>
                          <div class="text-gray-400 text-xs">{{ order.filledQty }}/{{ order.qty }} sh · {{ order.type }}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-xs font-medium px-2 py-0.5 rounded-full"
                             [class]="getStatusClass(order.status)">
                          {{ order.status }}
                        </div>
                        @if (order.filledAvgPrice) {
                          <div class="text-gray-400 text-xs mt-0.5">@ {{ order.filledAvgPrice | currency:'USD' }}</div>
                        }
                        @if (order.status === 'new' || order.status === 'accepted' || order.status === 'pending_new') {
                          <button (click)="cancelOrder(order.orderId)"
                            class="text-red-400 text-xs hover:underline mt-1 block">Cancel</button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }

<!--               Trending
              @if (data && data.trending.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">Trending</h3>
                  <div class="grid grid-cols-2 gap-3">
                    @for (item of data.trending; track item.symbol) {
                      <button type="button" (click)="setTradeSymbol(item.symbol)"
                        class="bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-left hover:border-[#00FF88]/20 transition-colors">
                        <div class="flex justify-between items-start mb-2">
                          <div class="font-medium text-sm text-white">{{ item.symbol }}</div>
                          <div class="text-xs" [class]="item.changePercent >= 0 ? 'text-[#00FF88]' : 'text-red-500'">
                            {{ item.changePercent >= 0 ? '+' : '' }}{{ item.changePercent }}%
                          </div>
                        </div>
                        <div class="h-10 flex items-end gap-0.5">
                          @for (val of item.chartData; track $index) {
                            <div class="flex-1 rounded-t"
                                 [style.height.%]="getBarHeight(val, item.chartData)"
                                 [style.background-color]="item.changePercent >= 0 ? '#00FF88' : '#ef4444'"
                                 [style.opacity]="0.4 + ($index / item.chartData.length) * 0.6">
                            </div>
                          }
                        </div>
                        <div class="mt-2 text-xs text-gray-400">{{ item.price | currency:'USD' }}</div>
                      </button>
                    }
                  </div>
                </div>
              } -->

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
  orders: OrderSummary[] = [];
  loading = true;
  connecting = false;
  error = '';
  showLogoutConfirm = false;
  selectedPosition: AlpacaPosition | null = null;
  chartLoading = false;
  connectForm;

  // Trade panel state
  tradeForm!: FormGroup;
  tradeSide: 'buy' | 'sell' = 'buy';
  placingOrder = false;
  tradeError = '';
  lastOrderResult: OrderResult | null = null;

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
      x: { display: true, grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 6 } },
      y: {
        display: true,
        position: 'right',
        grid: { color: 'rgba(75,85,99,0.2)' },
        ticks: { color: '#6b7280', font: { size: 10 }, callback: (val) => '$' + Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }) }
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
  };

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.connectForm = this.fb.group({
      apiKey:    ['', [Validators.required, Validators.minLength(10)]],
      secretKey: ['', [Validators.required, Validators.minLength(10)]],
      isPaper:   [true]
    });

    this.tradeForm = this.fb.group({
      symbol:      ['', Validators.required],
      type:        ['market'],
      qty:         [null, [Validators.required, Validators.min(0.001)]],
      limitPrice:  [null],
      timeInForce: ['day']
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
        this.loadOrders();
        if (data.positions.length > 0) this.selectPosition(data.positions[0]);
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
      this.orders = [];
    });
  }

  selectPosition(pos: AlpacaPosition) {
    this.selectedPosition = pos;
    this.tradeForm.patchValue({ symbol: pos.symbol });
    this.loadBars(pos.symbol);
  }

  setSide(side: 'buy' | 'sell') {
    this.tradeSide = side;
  }

  setTradeSymbol(symbol: string) {
    this.tradeForm.patchValue({ symbol });
  }

  placeOrder() {
    if (this.tradeForm.invalid) return;
    this.placingOrder = true;
    this.tradeError = '';
    this.lastOrderResult = null;

    const { symbol, type, qty, limitPrice, timeInForce } = this.tradeForm.value;

    this.api.placeOrder({
      symbol: symbol.toUpperCase(),
      qty,
      side: this.tradeSide,
      type,
      limitPrice: type === 'limit' ? limitPrice : undefined,
      timeInForce
    }).subscribe({
      next: (result) => {
        this.lastOrderResult = result;
        this.placingOrder = false;
        this.tradeForm.patchValue({ qty: null, limitPrice: null });
        this.loadAccountData();
        this.loadOrders();
      },
      error: (err) => {
        this.tradeError = err.error?.error || 'Order failed. Please try again.';
        this.placingOrder = false;
      }
    });
  }

  loadOrders() {
    this.api.getOrders(20).subscribe({
      next: (orders) => this.orders = orders,
      error: () => {}
    });
  }

  cancelOrder(orderId: string) {
    this.api.cancelOrder(orderId).subscribe({
      next: () => this.loadOrders(),
      error: () => {}
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'filled':       return 'bg-[#00FF88]/15 text-[#00FF88]';
      case 'canceled':
      case 'cancelled':    return 'bg-gray-700 text-gray-400';
      case 'new':
      case 'accepted':
      case 'pending_new':  return 'bg-yellow-500/15 text-yellow-400';
      case 'partially_filled': return 'bg-blue-500/15 text-blue-400';
      default:             return 'bg-gray-700 text-gray-400';
    }
  }

  getSymbolBgColor(symbol: string): string {
    return this.symbolColors[symbol]?.bg || 'rgba(107,114,128,0.125)';
  }

  getSymbolTextColor(symbol: string): string {
    return this.symbolColors[symbol]?.text || 'rgb(107,114,128)';
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
        this.loadOrders();
        if (data.positions.length > 0 && !this.selectedPosition) {
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
        this.lineChartData = {
          labels: bars.map(b => {
            const d = new Date(b.time);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }),
          datasets: [{
            data: bars.map(b => b.close),
            borderColor: '#00FF88',
            backgroundColor: 'rgba(0, 255, 136, 0.08)',
            fill: true, tension: 0.4,
            pointRadius: 0, pointHoverRadius: 4,
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