import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import {
  CryptoPortfolio,
  CryptoHolding,
  TrendingCrypto,
} from '../../models/api.models';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MainLayoutComponent,
    CurrencyPipe,
    BaseChartDirective,
  ],
  template: `
    <app-main-layout pageTitle="Crypto Portfolio" activePage="crypto">
      <div class="h-full flex flex-col text-white overflow-hidden">
        @if (loading) {
          <div class="flex-1 flex items-center justify-center">
            <div
              class="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"
            ></div>
          </div>
        } @else {
          <div class="flex-1 overflow-y-auto pb-20">
            <div class="p-4 space-y-5">
              <div class="text-center space-y-1 py-4">
                <h2 class="text-gray-400 text-sm">Total Crypto Value</h2>
                <div class="text-4xl font-bold text-white">
                  {{
                    portfolio?.totalBalance
                      | currency: 'USD' : 'symbol' : '1.2-2'
                  }}
                </div>
                <div class="flex items-center justify-center gap-2 pt-1">
                  <span
                    class="text-xs font-medium px-2 py-0.5 rounded-full"
                    [class]="
                      (portfolio?.changePercent ?? 0) >= 0
                        ? 'bg-[#00FF88]/15 text-[#00FF88]'
                        : 'bg-red-500/15 text-red-400'
                    "
                  >
                    {{ (portfolio?.changePercent ?? 0) >= 0 ? '+' : ''
                    }}{{ portfolio?.changePercent | number: '1.2-2' }}% today
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ (portfolio?.changeAmount ?? 0) >= 0 ? '+' : ''
                    }}{{
                      portfolio?.changeAmount
                        | currency: 'USD' : 'symbol' : '1.2-2'
                    }}
                  </span>
                </div>
                <p class="text-gray-600 text-xs pt-1">
                  Live prices via Binance public feed
                </p>
              </div>

              @if (portfolio && portfolio.holdings.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">
                    Your Holdings
                  </h3>
                  @for (holding of portfolio.holdings; track holding.id) {
                    <button
                      (click)="selectHolding(holding)"
                      class="w-full flex items-center justify-between p-3 rounded-2xl transition-all border"
                      [class]="
                        selectedHolding?.id === holding.id
                          ? 'bg-gray-800/60 border-[#00FF88]/30'
                          : 'bg-gray-900/50 hover:bg-gray-800/60 border-transparent hover:border-[#00FF88]/20'
                      "
                    >
                      <div class="flex items-center gap-3">
                        <div
                          class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                          [style.background-color]="
                            getAssetBgColor(holding.symbol)
                          "
                          [style.color]="getAssetTextColor(holding.symbol)"
                        >
                          {{ holding.symbol.charAt(0) }}
                        </div>
                        <div class="text-left">
                          <div class="font-medium">{{ holding.symbol }}</div>
                          <div class="text-xs text-gray-400">
                            {{ holding.amount }} coins @
                            {{
                              holding.pricePerUnit
                                | currency: 'USD' : 'symbol' : '1.2-4'
                            }}
                          </div>
                        </div>
                      </div>
                      <div class="flex items-center gap-3">
                        <div class="text-right">
                          <div class="font-medium">
                            {{
                              holding.totalValue
                                | currency: 'USD' : 'symbol' : '1.2-2'
                            }}
                          </div>
                        </div>
                        <button
                          type="button"
                          (click)="
                            $event.stopPropagation(); deleteHolding(holding.id)
                          "
                          class="text-gray-600 hover:text-red-400 transition-colors p-1"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="size-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path
                              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                            />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </button>
                  }
                </div>
              } @else {
                <div class="text-center py-6">
                  <p class="text-gray-500 text-sm">
                    No holdings yet. Add your first crypto below.
                  </p>
                </div>
              }

              @if (selectedHolding) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between px-1">
                    <h3 class="text-gray-400 text-sm font-medium">
                      {{ selectedHolding.symbol }}/USDT — 30 Day Price
                    </h3>
                    @if (chartLoading) {
                      <div
                        class="w-4 h-4 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"
                      ></div>
                    }
                  </div>
                  <div
                    class="bg-gray-900/50 rounded-2xl p-3 border border-gray-800"
                  >
                    @if (
                      !chartLoading && lineChartData.datasets[0].data.length > 0
                    ) {
                      <div style="height: 200px; position: relative;">
                        <canvas
                          baseChart
                          [data]="lineChartData"
                          [options]="lineChartOptions"
                          [type]="'line'"
                        >
                        </canvas>
                      </div>
                    } @else if (!chartLoading) {
                      <div
                        class="h-[200px] flex items-center justify-center text-gray-500 text-sm"
                      >
                        No chart data available
                      </div>
                    } @else {
                      <div class="h-[200px] flex items-center justify-center">
                        <div
                          class="w-6 h-6 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"
                        ></div>
                      </div>
                    }
                  </div>
                </div>
              }

              <div
                class="bg-gray-800/40 border border-gray-700 rounded-2xl p-5 space-y-4"
              >
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-semibold">Add Holding</h3>
                  <button
                    type="button"
                    (click)="showForm = !showForm"
                    class="text-gray-400 hover:text-white transition-colors text-xs"
                  >
                    {{ showForm ? 'Hide' : 'Show' }}
                  </button>
                </div>

                @if (showForm) {
                  <form
                    [formGroup]="addForm"
                    (ngSubmit)="onAdd()"
                    class="space-y-3"
                  >
                    <div>
                      <label class="text-gray-400 text-xs mb-2 block"
                        >Quick Select</label
                      >
                      <div class="flex flex-wrap gap-2">
                        @for (coin of popularCoins; track coin) {
                          <button
                            type="button"
                            (click)="quickSelect(coin)"
                            class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors"
                            [class]="
                              addForm.get('symbol')?.value === coin
                                ? 'bg-[#00FF88]/20 border-[#00FF88]/50 text-[#00FF88]'
                                : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white'
                            "
                          >
                            {{ coin }}
                          </button>
                        }
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                          >Symbol</label
                        >
                        <input
                          type="text"
                          formControlName="symbol"
                          placeholder="BTC"
                          (blur)="
                            fetchLivePrice(addForm.get('symbol')?.value || '')
                          "
                          class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 uppercase focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all"
                        />
                      </div>
                      <div>
                        <label class="text-gray-400 text-xs mb-1 block"
                          >Name</label
                        >
                        <input
                          type="text"
                          formControlName="name"
                          placeholder="Bitcoin"
                          class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all"
                        />
                      </div>
                    </div>

                    @if (fetchingPrice) {
                      <div
                        class="flex items-center gap-2 text-gray-400 text-xs"
                      >
                        <div
                          class="w-3 h-3 border border-[#00FF88] border-t-transparent rounded-full animate-spin"
                        ></div>
                        Fetching live price...
                      </div>
                    }
                    @if (livePrice && !fetchingPrice) {
                      <div
                        class="bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-xl px-4 py-3 flex justify-between items-center"
                      >
                        <span class="text-gray-400 text-xs"
                          >Live Price (Binance)</span
                        >
                        <span class="text-[#00FF88] font-semibold text-sm"
                          >\${{ livePrice | number: '1.2-4' }}</span
                        >
                      </div>
                    }
                    @if (livePriceError) {
                      <div class="text-red-400 text-xs">
                        {{ livePriceError }}
                      </div>
                    }

                    <div>
                      <label class="text-gray-400 text-xs mb-1 block"
                        >Amount (coins)</label
                      >
                      <input
                        type="number"
                        formControlName="amount"
                        placeholder="0.5"
                        min="0"
                        step="any"
                        class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#00FF88]/50 transition-all"
                      />
                    </div>

                    @if (addError) {
                      <div class="text-red-400 text-xs">{{ addError }}</div>
                    }

                    <button
                      type="submit"
                      [disabled]="addForm.invalid || adding || !livePrice"
                      class="w-full h-11 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {{ adding ? 'Adding...' : '+ Add to Portfolio' }}
                    </button>
                  </form>
                }
              </div>

              @if (portfolio && portfolio.trending.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">
                    Trending
                  </h3>
                  <div class="grid grid-cols-2 gap-3">
                    @for (item of portfolio.trending; track item.symbol) {
                      <button
                        type="button"
                        (click)="quickSelect(item.symbol)"
                        class="bg-gray-900/50 p-3 rounded-xl border border-gray-800 text-left hover:border-[#00FF88]/20 transition-colors"
                      >
                        <div class="flex justify-between items-start mb-2">
                          <div class="font-medium text-sm text-white">
                            {{ item.symbol }}
                          </div>
                          <div
                            class="text-xs"
                            [class]="
                              item.changePercent >= 0
                                ? 'text-[#00FF88]'
                                : 'text-red-500'
                            "
                          >
                            {{ item.changePercent >= 0 ? '+' : ''
                            }}{{ item.changePercent | number: '1.2-2' }}%
                          </div>
                        </div>
                        <div class="h-10 flex items-end gap-0.5">
                          @for (val of item.chartData; track $index) {
                            <div
                              class="flex-1 rounded-t"
                              [style.height.%]="
                                getBarHeight(val, item.chartData)
                              "
                              [style.background-color]="
                                item.changePercent >= 0 ? '#00FF88' : '#ef4444'
                              "
                              [style.opacity]="
                                0.4 + ($index / item.chartData.length) * 0.6
                              "
                            ></div>
                          }
                        </div>
                        <div class="mt-2 text-xs text-gray-400">
                          {{
                            item.price | currency: 'USD' : 'symbol' : '1.2-2'
                          }}
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `,
})
export class CryptoComponent implements OnInit {
  portfolio: CryptoPortfolio | null = null;
  loading = true;
  adding = false;
  addError = '';
  showForm = true;
  selectedHolding: CryptoHolding | null = null;
  chartLoading = false;
  addForm;

  readonly popularCoins = [
    'BTC',
    'ETH',
    'SOL',
    'BNB',
    'XRP',
    'ADA',
    'DOGE',
    'AVAX',
  ];
  fetchingPrice = false;
  livePrice: number | null = null;
  livePriceError = '';

  private readonly coinNames: Record<string, string> = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    SOL: 'Solana',
    BNB: 'BNB',
    XRP: 'Ripple',
    ADA: 'Cardano',
    DOGE: 'Dogecoin',
    AVAX: 'Avalanche',
    MATIC: 'Polygon',
    DOT: 'Polkadot',
    LINK: 'Chainlink',
    UNI: 'Uniswap',
    PEPE: 'Pepe',
    TIA: 'Celestia',
    ARB: 'Arbitrum',
    SEI: 'Sei',
  };

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        borderColor: '#00FF88',
        backgroundColor: 'rgba(0, 255, 136, 0.08)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#00FF88',
        borderWidth: 2,
      },
    ],
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
          label: (ctx) =>
            `$${Number(ctx.raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 6 },
      },
      y: {
        display: true,
        position: 'right',
        grid: { color: 'rgba(75,85,99,0.2)' },
        ticks: {
          color: '#6b7280',
          font: { size: 10 },
          callback: (val) =>
            '$' +
            Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        },
      },
    },
  };

  private readonly assetColors: Record<string, { bg: string; text: string }> = {
    BTC: { bg: 'rgba(247,147,26,0.125)', text: 'rgb(247,147,26)' },
    ETH: { bg: 'rgba(98,126,234,0.125)', text: 'rgb(98,126,234)' },
    BNB: { bg: 'rgba(243,186,47,0.125)', text: 'rgb(243,186,47)' },
    SOL: { bg: 'rgba(20,241,149,0.125)', text: 'rgb(20,241,149)' },
    XRP: { bg: 'rgba(0,114,198,0.125)', text: 'rgb(0,114,198)' },
    ADA: { bg: 'rgba(0,51,173,0.125)', text: 'rgb(0,51,173)' },
    DOGE: { bg: 'rgba(196,178,71,0.125)', text: 'rgb(196,178,71)' },
    AVAX: { bg: 'rgba(232,65,66,0.125)', text: 'rgb(232,65,66)' },
    MATIC: { bg: 'rgba(130,71,229,0.125)', text: 'rgb(130,71,229)' },
    DOT: { bg: 'rgba(230,0,122,0.125)', text: 'rgb(230,0,122)' },
  };

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
  ) {
    this.addForm = this.fb.group({
      symbol: ['', Validators.required],
      name: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.000001)]],
    });
  }

  ngOnInit() {
    this.loadPortfolio();
  }

  loadPortfolio() {
    this.api.getCryptoPortfolio().subscribe({
      next: (data) => {
        this.portfolio = data;
        this.loading = false;

        if (data.holdings.length > 0 && !this.selectedHolding) {
          this.selectHolding(data.holdings[0]);
        }
      },
      error: () => (this.loading = false),
    });
  }

  selectHolding(holding: CryptoHolding) {
    this.selectedHolding = holding;
    this.loadChart(holding.symbol);
  }

  quickSelect(symbol: string) {
    this.addForm.patchValue({
      symbol,
      name: this.coinNames[symbol] ?? symbol,
    });
    this.showForm = true;
    this.fetchLivePrice(symbol);
  }

  fetchLivePrice(symbol: string) {
    if (!symbol) return;
    this.fetchingPrice = true;
    this.livePrice = null;
    this.livePriceError = '';
    this.api.getCryptoLivePrice(symbol).subscribe({
      next: (data) => {
        this.livePrice = data.price;
        this.fetchingPrice = false;
      },
      error: () => {
        this.livePriceError = `Could not fetch price for ${symbol}. Check the symbol.`;
        this.fetchingPrice = false;
      },
    });
  }

  onAdd() {
    if (this.addForm.invalid) return;
    this.adding = true;
    this.addError = '';

    const symbol = (this.addForm.value.symbol as string) ?? '';
    const name = (this.addForm.value.name as string) ?? '';
    const amount = Number(this.addForm.value.amount);

    const pricePerUnit = this.livePrice ?? 0;

    this.api
      .createCryptoHolding({
        symbol: symbol.toUpperCase(),
        name,
        amount,
        pricePerUnit,
        color:
          this.assetColors[symbol.toUpperCase()]?.bg ??
          'rgba(107,114,128,0.125)',
      })
      .subscribe({
        next: () => {
          this.adding = false;
          this.addForm.reset();
          this.loadPortfolio();
        },
        error: (err) => {
          this.addError = err.error?.message || 'Failed to add holding.';
          this.adding = false;
        },
      });
  }

  deleteHolding(id: string) {
    this.api.deleteCryptoHolding(id).subscribe({
      next: () => {
        if (this.selectedHolding?.id === id) this.selectedHolding = null;
        this.loadPortfolio();
      },
    });
  }

  getAssetBgColor(symbol: string): string {
    return this.assetColors[symbol]?.bg ?? 'rgba(107,114,128,0.125)';
  }

  getAssetTextColor(symbol: string): string {
    return this.assetColors[symbol]?.text ?? 'rgb(107,114,128)';
  }

  getBarHeight(val: number, data: number[]): number {
    const max = Math.max(...data);
    const min = Math.min(...data);
    if (max === min) return 50;
    return 20 + ((val - min) / (max - min)) * 80;
  }

  private loadChart(symbol: string) {
    this.chartLoading = true;
    this.api.getBinanceKlines(symbol, '1d', 30).subscribe({
      next: (points) => {
        this.lineChartData = {
          labels: points.map((p) => {
            const d = new Date(p.time);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }),
          datasets: [
            {
              data: points.map((p) => p.close),
              borderColor: '#00FF88',
              backgroundColor: 'rgba(0, 255, 136, 0.08)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: '#00FF88',
              borderWidth: 2,
            },
          ],
        };
        this.chartLoading = false;
      },
      error: () => (this.chartLoading = false),
    });
  }
}
