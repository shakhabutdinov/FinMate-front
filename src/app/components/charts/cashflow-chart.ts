import { Component, computed, input, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Transaction } from '../../models/api.models';

export type CashflowPeriod = 'week' | 'month' | 'year' | 'all';

interface Bucket {
  ts: number;
  label: string;
  income: number;
  expense: number;
}
interface Pt {
  x: number;
  y: number;
  v: number;
}

@Component({
  selector: 'app-cashflow-chart',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div
      class="rounded-2xl border p-4 lg:p-5"
      style="background: var(--surface-2); border-color: var(--border-1);"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <h3 class="font-semibold" style="color: var(--text-1);">
            Income vs Expenses
          </h3>
          <div class="hidden sm:flex items-center gap-3">
            <span
              class="flex items-center gap-1.5 text-xs"
              style="color: var(--text-3);"
            >
              <span
                class="w-3 h-1.5 rounded-full"
                style="background: #00FF88;"
              ></span
              >Income
            </span>
            <span
              class="flex items-center gap-1.5 text-xs"
              style="color: var(--text-3);"
            >
              <span
                class="w-3 h-1.5 rounded-full"
                style="background: #ef4444;"
              ></span
              >Expenses
            </span>
          </div>
        </div>
        @if (showFilters()) {
          <div
            class="inline-flex p-0.5 rounded-full border"
            style="background: var(--surface-3); border-color: var(--border-1);"
          >
            @for (p of periods; track p.id) {
              <button
                (click)="period.set(p.id)"
                class="h-8 px-3 text-xs font-semibold rounded-full transition-all"
                [class]="period() === p.id ? 'text-black shadow-sm' : ''"
                [style.background]="
                  period() === p.id ? '#00FF88' : 'transparent'
                "
                [style.color]="period() === p.id ? '#0a0a0a' : 'var(--text-3)'"
              >
                {{ p.label }}
              </button>
            }
          </div>
        }
      </div>

      <div class="grid grid-cols-3 gap-3 mb-3">
        <div
          class="rounded-xl p-3"
          style="background: rgba(0,255,136,0.10); border: 1px solid rgba(0,255,136,0.20);"
        >
          <div
            class="text-[10px] uppercase tracking-wider"
            style="color: var(--text-4);"
          >
            Income
          </div>
          <div class="text-base font-semibold" style="color: #00FF88;">
            {{ totals().income | currency: 'USD' : 'symbol' : '1.0-0' }}
          </div>
        </div>
        <div
          class="rounded-xl p-3"
          style="background: rgba(239,68,68,0.10); border: 1px solid rgba(239,68,68,0.20);"
        >
          <div
            class="text-[10px] uppercase tracking-wider"
            style="color: var(--text-4);"
          >
            Expenses
          </div>
          <div class="text-base font-semibold" style="color: #ef4444;">
            {{ totals().expense | currency: 'USD' : 'symbol' : '1.0-0' }}
          </div>
        </div>
        <div
          class="rounded-xl p-3"
          style="background: var(--surface-3); border: 1px solid var(--border-1);"
        >
          <div
            class="text-[10px] uppercase tracking-wider"
            style="color: var(--text-4);"
          >
            Net
          </div>
          <div
            class="text-base font-semibold"
            [style.color]="totals().net >= 0 ? '#00FF88' : '#ef4444'"
          >
            {{ totals().net | currency: 'USD' : 'symbol' : '1.0-0' }}
          </div>
        </div>
      </div>

      <div class="relative" [style.height.px]="chartHeight()">
        @if (buckets().length < 2) {
          <div
            class="absolute inset-0 flex items-center justify-center text-sm"
            style="color: var(--text-3);"
          >
            Not enough data for {{ currentPeriod().label }} yet.
          </div>
        } @else {
          <svg
            [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH"
            preserveAspectRatio="none"
            class="w-full h-full"
            (mousemove)="onMove($event)"
            (mouseleave)="hover.set(null)"
          >
            @for (g of gridlines(); track g.y) {
              <line
                [attr.x1]="padX"
                [attr.x2]="svgW - padR"
                [attr.y1]="g.y"
                [attr.y2]="g.y"
                stroke="currentColor"
                stroke-width="1"
                stroke-dasharray="2 4"
                style="color: var(--border-1); opacity: 0.6;"
              />
              <text
                [attr.x]="svgW - padR + 6"
                [attr.y]="g.y + 3"
                font-size="10"
                font-family="ui-sans-serif, system-ui"
                style="fill: var(--text-4);"
              >
                {{ formatY(g.value) }}
              </text>
            }

            <path [attr.d]="incomeArea()" fill="url(#incomeFill)" />

            <path [attr.d]="expenseArea()" fill="url(#expenseFill)" />

            <path
              [attr.d]="incomePath()"
              fill="none"
              stroke="#00FF88"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <path
              [attr.d]="expensePath()"
              fill="none"
              stroke="#ef4444"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <defs>
              <linearGradient id="incomeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#00FF88" stop-opacity="0.30" />
                <stop offset="100%" stop-color="#00FF88" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="expenseFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.18" />
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
              </linearGradient>
            </defs>

            @if (hover(); as h) {
              <line
                [attr.x1]="h.xPx"
                [attr.x2]="h.xPx"
                [attr.y1]="padY"
                [attr.y2]="svgH - padB"
                stroke="currentColor"
                stroke-width="1"
                stroke-dasharray="3 3"
                style="color: var(--text-4); opacity: 0.7;"
              />
              <circle
                [attr.cx]="h.xPx"
                [attr.cy]="h.incomeY"
                r="4"
                fill="#00FF88"
                stroke="white"
                stroke-width="1.5"
              />
              <circle
                [attr.cx]="h.xPx"
                [attr.cy]="h.expenseY"
                r="4"
                fill="#ef4444"
                stroke="white"
                stroke-width="1.5"
              />
            }

            @for (l of xLabels(); track l.x) {
              <text
                [attr.x]="l.x"
                [attr.y]="svgH - 4"
                text-anchor="middle"
                font-size="10"
                font-family="ui-sans-serif, system-ui"
                style="fill: var(--text-4);"
              >
                {{ l.text }}
              </text>
            }
          </svg>

          @if (hover(); as h) {
            <div
              class="absolute pointer-events-none rounded-lg px-3 py-2 text-xs shadow-lg border"
              [style.left.%]="h.xPct"
              [style.transform]="
                h.xPct > 70 ? 'translate(-110%, -50%)' : 'translate(10%, -50%)'
              "
              [style.top.%]="35"
              style="background: var(--surface-modal); border-color: var(--border-1); color: var(--text-1); white-space: nowrap;"
            >
              <div class="font-semibold mb-1">{{ h.label }}</div>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 rounded-full"
                  style="background: #00FF88;"
                ></span>
                <span style="color: var(--text-3);">Income</span>
                <span class="ml-auto font-medium">{{
                  h.income | currency: 'USD' : 'symbol' : '1.0-0'
                }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span
                  class="w-2 h-2 rounded-full"
                  style="background: #ef4444;"
                ></span>
                <span style="color: var(--text-3);">Expenses</span>
                <span class="ml-auto font-medium">{{
                  h.expense | currency: 'USD' : 'symbol' : '1.0-0'
                }}</span>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class CashflowChartComponent {
  transactions = input<Transaction[]>([]);
  initialPeriod = input<CashflowPeriod>('month');
  showFilters = input<boolean>(true);
  height = input<number>(0);

  period = signal<CashflowPeriod>('month');

  readonly periods: { id: CashflowPeriod; label: string }[] = [
    { id: 'week', label: '1W' },
    { id: 'month', label: '1M' },
    { id: 'year', label: '1Y' },
    { id: 'all', label: 'All' },
  ];

  readonly svgW = 600;
  readonly svgH = 220;
  readonly padX = 8;
  readonly padR = 44;
  readonly padY = 12;
  readonly padB = 22;

  hover = signal<{
    xPct: number;
    xPx: number;
    incomeY: number;
    expenseY: number;
    income: number;
    expense: number;
    label: string;
  } | null>(null);

  constructor() {
    queueMicrotask(() => this.period.set(this.initialPeriod() ?? 'month'));
  }

  chartHeight = computed(() => this.height() || 220);

  currentPeriod = computed(
    () => this.periods.find((p) => p.id === this.period()) ?? this.periods[1],
  );

  buckets = computed<Bucket[]>(() => {
    const txs = this.transactions() ?? [];
    if (!txs.length) return [];
    const now = new Date();
    const p = this.period();

    if (p === 'week')
      return this.bucketDays(txs, this.subDays(now, 6), now, 7, this.dayLabel);
    if (p === 'month')
      return this.bucketDays(
        txs,
        this.subDays(now, 29),
        now,
        30,
        this.dayLabelShort,
      );
    if (p === 'year')
      return this.bucketMonths(txs, this.subMonths(now, 11), now, 12);

    let earliest = txs.reduce(
      (min, t) => Math.min(min, +new Date(t.date)),
      Infinity,
    );
    if (!isFinite(earliest)) earliest = +this.subMonths(now, 11);
    const start = new Date(earliest);
    const months = Math.max(
      2,
      Math.min(
        36,
        (now.getFullYear() - start.getFullYear()) * 12 +
          (now.getMonth() - start.getMonth()) +
          1,
      ),
    );
    return this.bucketMonths(txs, this.subMonths(now, months - 1), now, months);
  });

  totals = computed(() => {
    const b = this.buckets();
    const income = b.reduce((s, x) => s + x.income, 0);
    const expense = b.reduce((s, x) => s + x.expense, 0);
    return { income, expense, net: income - expense };
  });

  private maxY = computed(() => {
    const b = this.buckets();
    let m = 0;
    for (const x of b) m = Math.max(m, x.income, x.expense);
    return Math.max(10, this.niceCeil(m));
  });

  private incomePts = computed<Pt[]>(() =>
    this.buildPoints(this.buckets(), (x) => x.income),
  );
  private expensePts = computed<Pt[]>(() =>
    this.buildPoints(this.buckets(), (x) => x.expense),
  );

  incomePath = computed(() => this.smoothPath(this.incomePts()));
  expensePath = computed(() => this.smoothPath(this.expensePts()));
  incomeArea = computed(() => this.toArea(this.incomePts()));
  expenseArea = computed(() => this.toArea(this.expensePts()));

  gridlines = computed(() => {
    const max = this.maxY();
    const lines: { y: number; value: number }[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const v = (max * (steps - i)) / steps;
      const y = this.padY + ((this.svgH - this.padY - this.padB) * i) / steps;
      lines.push({ y, value: v });
    }
    return lines;
  });

  xLabels = computed(() => {
    const b = this.buckets();
    if (b.length === 0) return [];
    const targetCount = b.length <= 7 ? b.length : 6;
    const step = Math.max(1, Math.floor(b.length / targetCount));
    const labels: { x: number; text: string }[] = [];
    const innerW = this.svgW - this.padX - this.padR;
    for (let i = 0; i < b.length; i += step) {
      const x = this.padX + (innerW * i) / Math.max(1, b.length - 1);
      labels.push({ x, text: b[i].label });
    }
    if (labels[labels.length - 1].x < this.svgW - this.padR - 24) {
      labels.push({ x: this.padX + innerW, text: b[b.length - 1].label });
    }
    return labels;
  });

  formatY(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
    return Math.round(v).toString();
  }

  onMove(ev: MouseEvent) {
    const target = ev.currentTarget as SVGSVGElement;
    const rect = target.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, px / rect.width));
    const xSvg = this.padX + ratio * (this.svgW - this.padX - this.padR);
    const b = this.buckets();
    if (b.length < 2) return;
    const idx = Math.round(
      ((xSvg - this.padX) / (this.svgW - this.padX - this.padR)) *
        (b.length - 1),
    );
    const i = Math.max(0, Math.min(b.length - 1, idx));
    const inc = this.incomePts()[i];
    const exp = this.expensePts()[i];
    this.hover.set({
      xPct: (inc.x / this.svgW) * 100,
      xPx: inc.x,
      incomeY: inc.y,
      expenseY: exp.y,
      income: b[i].income,
      expense: b[i].expense,
      label: b[i].label,
    });
  }

  private buildPoints(b: Bucket[], pick: (x: Bucket) => number): Pt[] {
    const max = this.maxY();
    const innerW = this.svgW - this.padX - this.padR;
    const innerH = this.svgH - this.padY - this.padB;
    return b.map((bk, i) => {
      const v = pick(bk);
      const x = this.padX + (innerW * i) / Math.max(1, b.length - 1);
      const y = this.padY + innerH * (1 - v / max);
      return { x, y, v };
    });
  }

  private smoothPath(pts: Pt[]): string {
    if (pts.length < 2) return '';
    const d: string[] = [`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`];
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cx = (p0.x + p1.x) / 2;
      d.push(
        `C${cx.toFixed(1)},${p0.y.toFixed(1)} ${cx.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`,
      );
    }
    return d.join(' ');
  }

  private toArea(pts: Pt[]): string {
    if (pts.length < 2) return '';
    const baseY = this.svgH - this.padB;
    const path = this.smoothPath(pts);
    const last = pts[pts.length - 1];
    const first = pts[0];
    return `${path} L${last.x.toFixed(1)},${baseY} L${first.x.toFixed(1)},${baseY} Z`;
  }

  private niceCeil(n: number): number {
    if (n <= 0) return 10;
    const exp = Math.pow(10, Math.floor(Math.log10(n)));
    const f = n / exp;
    let nf: number;
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
    return nf * exp;
  }

  private bucketDays(
    txs: Transaction[],
    start: Date,
    end: Date,
    count: number,
    labelFn: (d: Date) => string,
  ): Bucket[] {
    const buckets: Bucket[] = [];
    for (let i = 0; i < count; i++) {
      const day = this.addDays(start, i);
      buckets.push({
        ts: this.startOfDay(day).getTime(),
        label: labelFn(day),
        income: 0,
        expense: 0,
      });
    }
    for (const t of txs) {
      const ts = this.startOfDay(new Date(t.date)).getTime();
      const idx = buckets.findIndex((b) => b.ts === ts);
      if (idx >= 0) {
        if (t.type === 'Income') buckets[idx].income += t.amount;
        else buckets[idx].expense += t.amount;
      }
    }
    return buckets;
  }

  private bucketMonths(
    txs: Transaction[],
    start: Date,
    end: Date,
    count: number,
  ): Bucket[] {
    const buckets: Bucket[] = [];
    const s = new Date(start.getFullYear(), start.getMonth(), 1);
    for (let i = 0; i < count; i++) {
      const d = new Date(s.getFullYear(), s.getMonth() + i, 1);
      buckets.push({
        ts: d.getTime(),
        label:
          d.toLocaleDateString(undefined, { month: 'short' }) +
          (count > 12 ? ' ' + d.getFullYear().toString().slice(-2) : ''),
        income: 0,
        expense: 0,
      });
    }
    for (const t of txs) {
      const td = new Date(t.date);
      const ts = new Date(td.getFullYear(), td.getMonth(), 1).getTime();
      const idx = buckets.findIndex((b) => b.ts === ts);
      if (idx >= 0) {
        if (t.type === 'Income') buckets[idx].income += t.amount;
        else buckets[idx].expense += t.amount;
      }
    }
    return buckets;
  }

  private startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  private addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  private subDays(d: Date, n: number) {
    return this.addDays(d, -n);
  }
  private subMonths(d: Date, n: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() - n);
    return x;
  }

  private dayLabel = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: 'short' });
  private dayLabelShort = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
}
