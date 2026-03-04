import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { MainLayoutComponent } from '../layout/main-layout';
import { ApiService } from '../../services/api.service';
import { BinanceAccountData, BinanceAsset, KlinePoint } from '../../models/api.models';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MainLayoutComponent, BaseChartDirective],
  template: `
    <app-main-layout pageTitle="Crypto Assets" activePage="crypto">
      <div class="h-full flex flex-col text-white overflow-hidden">
        @if (loading) {
          <div class="flex-1 flex items-center justify-center">
            <div class="w-8 h-8 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (!accountData || !accountData.isConnected) {
          <!-- Not Connected -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <div class="flex flex-col items-center justify-center pt-8 pb-4">
              <div class="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-10 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L6.5 7.5 8.36 9.36 12 5.72 15.64 9.36 17.5 7.5z"/>
                  <path d="M4.5 12L2.64 10.14.78 12 2.64 13.86z"/>
                  <path d="M12 22l5.5-5.5-1.86-1.86L12 18.28l-3.64-3.64L6.5 16.5z"/>
                  <path d="M19.5 12l1.86-1.86L23.22 12l-1.86 1.86z"/>
                  <path d="M12 8.57L8.57 12 12 15.43 15.43 12z"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white mb-2">Binance Not Connected</h2>
              <p class="text-gray-400 text-sm text-center px-6 mb-6">Connect your Binance account with read-only API keys to view your crypto portfolio.</p>
            </div>

            <div class="bg-gray-800/40 border border-gray-700 rounded-2xl p-5">
              <h3 class="text-white font-semibold mb-4">Connect Your Account</h3>
              <form [formGroup]="connectForm" (ngSubmit)="onConnect()" class="space-y-3">
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">API Key</label>
                  <input type="text" formControlName="apiKey" placeholder="Enter your Binance API Key" class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all">
                </div>
                <div>
                  <label class="text-gray-400 text-xs mb-1 block">Secret Key</label>
                  <input type="password" formControlName="secretKey" placeholder="Enter your Binance Secret Key" class="w-full h-11 bg-gray-800/50 border border-gray-700 text-white text-sm placeholder:text-gray-500 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all">
                </div>
                @if (error) {
                  <div class="text-red-400 text-sm">{{ error }}</div>
                }
                <button type="submit" [disabled]="connectForm.invalid || connecting" class="w-full h-11 bg-yellow-500 hover:bg-yellow-500/90 text-black rounded-lg transition-colors font-medium text-sm disabled:opacity-50 mt-2">
                  {{ connecting ? 'Connecting...' : 'Connect Binance' }}
                </button>
              </form>
            </div>

            <div class="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-4">
              <div class="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-5 text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <div class="text-xs text-gray-400 leading-relaxed">
                  <p class="font-medium text-gray-300 mb-1">How to get your API keys:</p>
                  <ol class="list-decimal list-inside space-y-0.5">
                    <li>Go to Binance &gt; API Management</li>
                    <li>Create a new API key</li>
                    <li>Enable only <span class="text-yellow-500">Read-Only</span> permissions</li>
                    <li>Paste the keys above</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <!-- Connected - Crypto Dashboard -->
          <div class="flex-1 overflow-y-auto pb-20">
            <div class="p-4 space-y-5">

              <!-- Total Balance Header -->
              <div class="text-center space-y-1 py-4">
                <div class="flex items-center justify-center gap-3">
                  <h2 class="text-gray-400 text-sm">Total Crypto Balance</h2>
                  <button (click)="showLogoutConfirm = true" class="text-gray-500 hover:text-red-400 transition-colors" title="Disconnect Binance">
                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </div>
                <div class="text-4xl font-bold text-white">\${{ accountData.totalBalanceUsdt | number:'1.2-2' }}</div>
              </div>

              <!-- Logout Confirmation -->
              @if (showLogoutConfirm) {
                <div class="bg-gray-900/80 border border-red-500/30 rounded-2xl p-4">
                  <p class="text-white text-sm font-medium mb-3 text-center">Disconnect Binance account?</p>
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

              <!-- Your Assets -->
              @if (accountData.assets.length > 0) {
                <div class="space-y-3">
                  <h3 class="text-gray-400 text-sm font-medium px-1">Your Assets</h3>
                  @for (asset of accountData.assets; track asset.asset) {
                    <button
                      (click)="selectAsset(asset)"
                      class="w-full flex items-center justify-between p-3 rounded-2xl transition-all border"
                      [class]="selectedAsset?.asset === asset.asset
                        ? 'bg-gray-800/60 border-[#00FF88]/30'
                        : 'bg-gray-900/50 hover:bg-gray-800/60 border-transparent hover:border-[#00FF88]/20'">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                             [style.background-color]="getAssetBgColor(asset.asset)"
                             [style.color]="getAssetTextColor(asset.asset)">
                          {{ asset.asset.charAt(0) }}
                        </div>
                        <div class="text-left">
                          <div class="font-medium">{{ asset.asset }}</div>
                          <div class="text-xs text-gray-400">\${{ getAssetUnitPrice(asset) | number:'1.2-6' }}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="font-medium">\${{ asset.usdtValue | number:'1.2-2' }}</div>
                        <div class="text-xs text-gray-400">{{ asset.total | number:'1.2-8' }} {{ asset.asset }}</div>
                      </div>
                    </button>
                  }
                </div>
              }

              <!-- Price Chart -->
              @if (selectedAsset) {
                <div class="space-y-3">
                  <div class="flex items-center justify-between px-1">
                    <h3 class="text-gray-400 text-sm font-medium">{{ selectedAsset.asset }} Price (30d)</h3>
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
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `
})
export class CryptoComponent implements OnInit {
  accountData: BinanceAccountData | null = null;
  loading = true;
  connecting = false;
  error = '';
  showLogoutConfirm = false;
  selectedAsset: BinanceAsset | null = null;
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
          label: (ctx) => `$${Number(ctx.raw).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
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

  private assetColors: Record<string, { bg: string; text: string }> = {
    BTC:  { bg: 'rgba(247,147,26,0.125)',  text: 'rgb(247,147,26)' },
    ETH:  { bg: 'rgba(98,126,234,0.125)',  text: 'rgb(98,126,234)' },
    BNB:  { bg: 'rgba(243,186,47,0.125)',  text: 'rgb(243,186,47)' },
    SOL:  { bg: 'rgba(20,241,149,0.125)',  text: 'rgb(20,241,149)' },
    USDT: { bg: 'rgba(38,161,123,0.125)',  text: 'rgb(38,161,123)' },
    USDC: { bg: 'rgba(39,117,202,0.125)',  text: 'rgb(39,117,202)' },
    XRP:  { bg: 'rgba(0,114,198,0.125)',   text: 'rgb(0,114,198)' },
    ADA:  { bg: 'rgba(0,51,173,0.125)',    text: 'rgb(0,51,173)' },
    DOGE: { bg: 'rgba(196,178,71,0.125)',  text: 'rgb(196,178,71)' },
    DOT:  { bg: 'rgba(230,0,122,0.125)',   text: 'rgb(230,0,122)' },
    AVAX: { bg: 'rgba(232,65,66,0.125)',   text: 'rgb(232,65,66)' },
    MATIC:{ bg: 'rgba(130,71,229,0.125)',  text: 'rgb(130,71,229)' },
  };

  constructor(private fb: FormBuilder, private api: ApiService) {
    this.connectForm = this.fb.group({
      apiKey: ['', [Validators.required, Validators.minLength(10)]],
      secretKey: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    this.api.getBinanceStatus().subscribe({
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
    const { apiKey, secretKey } = this.connectForm.value;
    this.api.connectBinance(apiKey!, secretKey!).subscribe({
      next: (data) => {
        this.accountData = data;
        this.connecting = false;
        if (data.assets.length > 0) {
          this.selectAsset(data.assets[0]);
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
    this.api.disconnectBinance().subscribe(() => {
      this.accountData = null;
      this.selectedAsset = null;
    });
  }

  selectAsset(asset: BinanceAsset) {
    this.selectedAsset = asset;
    this.loadKlines(asset.asset);
  }

  getAssetBgColor(symbol: string): string {
    return this.assetColors[symbol]?.bg || 'rgba(107,114,128,0.125)';
  }

  getAssetTextColor(symbol: string): string {
    return this.assetColors[symbol]?.text || 'rgb(107,114,128)';
  }

  getAssetUnitPrice(asset: BinanceAsset): number {
    if (asset.total === 0) return 0;
    return asset.usdtValue / asset.total;
  }

  private loadAccountData() {
    this.api.getBinanceAccount().subscribe({
      next: (data) => {
        this.accountData = data;
        this.loading = false;
        if (data.assets.length > 0) {
          this.selectAsset(data.assets[0]);
        }
      },
      error: () => this.loading = false
    });
  }

  private loadKlines(symbol: string) {
    this.chartLoading = true;
    this.api.getBinanceKlines(symbol, '1d', 30).subscribe({
      next: (points) => {
        const labels = points.map(p => {
          const d = new Date(p.time);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        });
        const data = points.map(p => p.close);

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
