import { Injectable } from '@angular/core';
import { forkJoin, of, catchError, from, switchMap } from 'rxjs';
import * as ExcelJS from 'exceljs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';


const G  = 'FF10B981';
const DK = 'FF0F172A';
const LG = 'FFECFDF5'; 
const AL = 'FFF0FDF4';
const WH = 'FFFFFFFF'; 
const RB = 'FFFEF2F2'; 
const GT = 'FF047857';
const RT = 'FFB91C1C'; 
const BD = 'FFD1FAE5'; 
const AM = 'FFFEF3C7';
const AT = 'FF92400E'; 


const b = (): Partial<ExcelJS.Borders> => {
  const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: BD } };
  return { top: s, bottom: s, left: s, right: s };
};


const title  = (c: ExcelJS.Cell) => { c.font = { name:'Calibri', bold:true, size:18, color:{argb:DK} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:LG} }; c.alignment = { vertical:'middle', horizontal:'left' }; };
const section= (c: ExcelJS.Cell) => { c.font = { name:'Calibri', bold:true, size:12, color:{argb:WH} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:G}  }; c.alignment = { vertical:'middle', horizontal:'left' }; };
const header = (c: ExcelJS.Cell) => { c.font = { name:'Calibri', bold:true, size:11, color:{argb:WH} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:DK} }; c.alignment = { vertical:'middle', horizontal:'center' }; c.border = b(); };
const label  = (c: ExcelJS.Cell) => { c.font = { name:'Calibri', bold:true, size:11, color:{argb:DK} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF8FAFC'} }; c.alignment = { vertical:'middle', horizontal:'left' }; c.border = b(); };
const cell   = (c: ExcelJS.Cell, alt=false) => { c.font = { name:'Calibri', size:11, color:{argb:'FF1F2937'} }; c.fill = { type:'pattern', pattern:'solid', fgColor:{argb:alt?AL:WH} }; c.alignment = { vertical:'middle', horizontal:'left' }; c.border = b(); };
const rAlign = (c: ExcelJS.Cell, alt=false) => { cell(c, alt); c.alignment = { vertical:'middle', horizontal:'right' }; };

const money  = (c: ExcelJS.Cell, opts:{alt?:boolean;pos?:boolean;neg?:boolean;big?:boolean}={}) => {
  const {alt=false,pos=false,neg=false,big=false}=opts;
  c.font      = { name:'Calibri', bold:pos||neg||big, size:big?14:11, color:{argb:pos?GT:neg?RT:DK} };
  c.fill      = { type:'pattern', pattern:'solid', fgColor:{argb:pos?LG:neg?RB:alt?AL:WH} };
  c.alignment = { vertical:'middle', horizontal:'right' };
  c.border    = b();
  c.numFmt    = '"$"#,##0.00';
};

const pct = (c: ExcelJS.Cell, opts:{pos?:boolean;neg?:boolean;muted?:boolean}={}) => {
  const {pos=false,neg=false,muted=false}=opts;
  c.font      = { name:'Calibri', bold:pos||neg, size:11, color:{argb:muted?'FF64748B':pos?GT:neg?RT:'FF1F2937'} };
  c.fill      = { type:'pattern', pattern:'solid', fgColor:{argb:pos?LG:neg?RB:WH} };
  c.alignment = { vertical:'middle', horizontal:'right' };
  c.border    = b();
  c.numFmt    = '0.0%';
};

const pnlMoney = (c: ExcelJS.Cell, val: number) => {
  money(c, { pos: val>0, neg: val<0 });
  c.numFmt = val>=0 ? '"+"$"#,##0.00' : '"-$"#,##0.00';
  c.value  = Math.abs(val);
};

const pnlPct = (c: ExcelJS.Cell, val: number) => {
  pct(c, { pos: val>0, neg: val<0 });
  c.numFmt = val>=0 ? '"+"+0.0%' : '"-"0.0%';
  c.value  = Math.abs(val);
};

const badge = (c: ExcelJS.Cell, income: boolean) => {
  c.font      = { name:'Calibri', bold:true, size:10, color:{argb:income?GT:RT} };
  c.fill      = { type:'pattern', pattern:'solid', fgColor:{argb:income?LG:RB} };
  c.alignment = { vertical:'middle', horizontal:'center' };
  c.border    = b();
};

const statusBadge = (c: ExcelJS.Cell, status: string) => {
  const map: Record<string, [string, string]> = {
    'Complete':    [LG, GT],
    'In Progress': ['FFEFF6FF', 'FF1D4ED8'],
    'At Risk':     [AM, AT],
    'Overdue':     [RB, RT],
  };
  const [bg, tx] = map[status] ?? [WH, DK];
  c.font      = { name:'Calibri', bold:true, size:10, color:{argb:tx} };
  c.fill      = { type:'pattern', pattern:'solid', fgColor:{argb:bg} };
  c.alignment = { vertical:'middle', horizontal:'center' };
  c.border    = b();
};

const totalRow = (row: ExcelJS.Row, cols: number) => {
  for (let i=1;i<=cols;i++) {
    const c = row.getCell(i);
    c.fill   = { type:'pattern', pattern:'solid', fgColor:{argb:LG} };
    c.border = b();
  }
  row.getCell(1).font = { name:'Calibri', bold:true, size:12, color:{argb:DK} };
  row.height = 22;
};


const fmtDate = (d: string|Date) => { try { return new Date(d).toISOString().slice(0,10); } catch { return String(d); } };

function goalStatus(g: any): string {
  const progress = (g.progressPercent ?? 0) / 100;
  if (progress >= 1) return 'Complete';
  const now = new Date();
  const dl  = new Date(g.deadline);
  if (dl < now) return 'Overdue';
  const monthsLeft = (dl.getTime() - now.getTime()) / (1000*60*60*24*30);
  if (monthsLeft < 3 && progress < 0.5) return 'At Risk';
  return 'In Progress';
}

function topCategories(transactions: any[], monthKey?: string): {cat:string;amt:number}[] {
  const map: Record<string,number> = {};
  (transactions??[]).forEach((t: any) => {
    if (t.type !== 'Expense') return;
    if (monthKey) {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      if (k !== monthKey) return;
    }
    map[t.category] = (map[t.category]||0) + Math.abs(t.amount??0);
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([cat,amt])=>({cat,amt}));
}

function calcPnl(livePrice: number, costBasis: number, qty: number) {
  const pnlAmt = (livePrice - costBasis) * qty;
  const pnlPct = costBasis > 0 ? (livePrice - costBasis) / costBasis : 0;
  return { pnlAmt, pnlPct };
}



@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private api: ApiService, private auth: AuthService) {}

  exportAllAsExcel() {
    const safe = <T>(obs: any, fallback: T) =>
      (obs as any).pipe(catchError(() => of(fallback)));

    return forkJoin({
      dashboard:    safe(this.api.getDashboard(), null),
      transactions: safe(this.api.getTransactions(), []),
      goals:        safe(this.api.getGoals(), []),
      stocks:       safe(this.api.getStockPortfolio(), null),
      crypto:       safe(this.api.getCryptoPortfolio(), null),
      pfm:          safe(this.api.getPfmOverview(), null),
    }).pipe(
      switchMap((data: any) => {
        const wb     = new ExcelJS.Workbook();
        wb.creator   = 'FinMate';
        wb.created   = new Date();

        this.buildSummary(wb, data);
        this.buildMonthlySnapshot(wb, data);
        if (data.dashboard?.assets?.length)   this.buildAssets(wb, data.dashboard.assets);
        if (data.transactions?.length)         this.buildTransactions(wb, data.transactions);
        if (data.goals?.length)                this.buildGoals(wb, data.goals);
        if (data.stocks?.holdings?.length)     this.buildStocks(wb, data.stocks);
        if (data.crypto?.holdings?.length)     this.buildCrypto(wb, data.crypto);
        if (data.pfm?.cashflowData?.length)    this.buildCashflow(wb, data.pfm, data.transactions);

        return from(wb.xlsx.writeBuffer()).pipe(

          switchMap((buffer: ArrayBuffer) => {
            const blob = new Blob([buffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href  = url;
            link.download = `finmate-export-${new Date().toISOString().slice(0,10)}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            return of(true);
          })
        );
      })
    );
  }


  private buildSummary(wb: ExcelJS.Workbook, data: any) {
    const ws   = wb.addWorksheet('Summary');
    const user = this.auth.currentUser();
    ws.columns = [{ width:28 },{ width:44 }];

    const tr = ws.addRow(['FinMate Financial Report']); title(tr.getCell(1)); tr.height=40;
    ws.addRow([]);

    [['Generated', new Date().toLocaleString()],
     ['Account',   `${user?.firstName??''} ${user?.lastName??''}`.trim()||'—'],
     ['Email',     user?.email??'']
    ].forEach(([k,v]) => {
      const r = ws.addRow([k,v]); label(r.getCell(1)); cell(r.getCell(2)); r.height=18;
    });

    ws.addRow([]);
    if (data.dashboard) {
      const sr = ws.addRow(['Portfolio Overview','']); [1,2].forEach(i=>section(sr.getCell(i))); sr.height=24;
      const br = ws.addRow(['Total Balance', data.dashboard.totalBalance??0]);
      label(br.getCell(1)); money(br.getCell(2),{big:true});
      const cr = ws.addRow(['Change Amount (1mo)', data.dashboard.changeAmount??0]);
      label(cr.getCell(1)); money(cr.getCell(2));
      const pr = ws.addRow(['Change Percent (1mo)', (data.dashboard.changePercent??0)/100]);
      label(pr.getCell(1)); pct(pr.getCell(2)); pr.getCell(2).numFmt='0.000%';
      ws.addRow([]);
    }

    if (data.pfm) {
      const sr = ws.addRow(['This Month','']); [1,2].forEach(i=>section(sr.getCell(i))); sr.height=24;
      const ir = ws.addRow(['Income MTD', data.pfm.incomeMtd??0]);    label(ir.getCell(1)); money(ir.getCell(2),{pos:true});
      const er = ws.addRow(['Expenses MTD', data.pfm.expensesMtd??0]); label(er.getCell(1)); money(er.getCell(2),{neg:true});
      const net = (data.pfm.incomeMtd??0)-(data.pfm.expensesMtd??0);
      const nr = ws.addRow(['Net MTD', net]); label(nr.getCell(1)); money(nr.getCell(2),{pos:net>=0,neg:net<0});
      const sr2 = (data.pfm.incomeMtd??0) > 0 ? net/(data.pfm.incomeMtd??1) : 0;
      const svr = ws.addRow(['Savings Rate', sr2]); label(svr.getCell(1)); pct(svr.getCell(2),{pos:sr2>=0.2,neg:sr2<0});
      ws.addRow([]);
    }

    const sr3 = ws.addRow(['Sheets in this workbook','']); [1,2].forEach(i=>section(sr3.getCell(i))); sr3.height=24;
    const hr = ws.addRow(['Sheet','Description']); header(hr.getCell(1)); header(hr.getCell(2)); hr.height=22;
    [['Summary','Top-level snapshot'], ['Monthly Snapshot','This month at a glance'],
     ['Assets','Savings & investment balances'], ['Transactions','Full income/expense ledger'],
     ['Goals','Progress & on-track status'], ['Stocks','Holdings with P&L'],
     ['Crypto','Holdings with P&L'], ['Cashflow','Monthly income, expenses & savings rate'],
    ].forEach(([n,d],i) => {
      const r = ws.addRow([n,d]); label(r.getCell(1)); cell(r.getCell(2),i%2===0); r.height=18;
    });
  }


  private buildMonthlySnapshot(wb: ExcelJS.Workbook, data: any) {
    const ws  = wb.addWorksheet('Monthly Snapshot');
    ws.columns = [{ width:30 },{ width:20 },{ width:16 },{ width:16 }];
    const now  = new Date();
    const monthName = now.toLocaleString('en', { month:'long', year:'numeric' });

    const tr = ws.addRow([`${monthName} — Monthly Snapshot`]); title(tr.getCell(1)); tr.height=40;
    ws.addRow([]);


    const s1 = ws.addRow(['Income & Expenses','','','']); [1,2,3,4].forEach(i=>section(s1.getCell(i))); s1.height=24;
    const hr1 = ws.addRow(['Metric','Value','','']); header(hr1.getCell(1)); header(hr1.getCell(2)); hr1.height=22;

    const inc = data.pfm?.incomeMtd??0;
    const exp = data.pfm?.expensesMtd??0;
    const net = inc-exp;
    const savingsRate = inc>0 ? net/inc : 0;

    [[`Income`, inc, false, true],[`Expenses`, exp, true, false],
     [`Net`, net, net<0, net>=0],[`Savings Rate`, savingsRate, savingsRate<0, savingsRate>=0.2]
    ].forEach((row, i) => {
      const [k,v,neg,pos] = row as [any,any,any,any];
      const r = ws.addRow([k,v]); label(r.getCell(1));
      if (k==='Savings Rate') { pct(r.getCell(2),{pos,neg}); }
      else { money(r.getCell(2),{pos,neg}); }
      r.height=20;
    });
    ws.addRow([]);


    const nowKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const cats   = topCategories(data.transactions, nowKey);
    const s2 = ws.addRow(['Top Spending Categories','','','']); [1,2,3,4].forEach(i=>section(s2.getCell(i))); s2.height=24;
    const hr2 = ws.addRow(['Category','Amount','% of Expenses','']); [1,2,3].forEach(i=>header(hr2.getCell(i))); hr2.height=22;
    if (cats.length) {
      cats.forEach((c,i) => {
        const share = exp>0 ? c.amt/exp : 0;
        const r = ws.addRow([c.cat, c.amt, share]);
        cell(r.getCell(1),i%2===0); money(r.getCell(2),{neg:true}); pct(r.getCell(3),{neg:true}); r.height=20;
      });
    } else {
      const r = ws.addRow(['No expense transactions this month','','']);
      cell(r.getCell(1)); r.getCell(1).font = { name:'Calibri', size:11, color:{argb:'FF94A3B8'}, italic:true };
    }
    ws.addRow([]);


    const s3 = ws.addRow(['Net Worth','','','']); [1,2,3,4].forEach(i=>section(s3.getCell(i))); s3.height=24;
    const hr3 = ws.addRow(['Metric','Value','','']); header(hr3.getCell(1)); header(hr3.getCell(2)); hr3.height=22;
    const totalBal   = data.dashboard?.totalBalance??0;
    const chgAmt     = data.dashboard?.changeAmount??0;
    const chgPct     = (data.dashboard?.changePercent??0)/100;
    [[`Total Net Worth`, totalBal, false, true],
     [`Change This Month ($)`, chgAmt, chgAmt<0, chgAmt>=0],
    ].forEach((row) => {
      const [k,v,neg,pos] = row as [any,any,any,any];
      const r = ws.addRow([k,v]); label(r.getCell(1)); money(r.getCell(2),{pos,neg,big:k.includes('Total')}); r.height=20;
    });
    const cr = ws.addRow(['Change This Month (%)', chgPct]);
    label(cr.getCell(1)); pct(cr.getCell(2),{pos:chgPct>=0,neg:chgPct<0}); cr.height=20;
    ws.addRow([]);


    const allHoldings = [
      ...(data.stocks?.holdings??[]).map((h: any) => ({
        name: h.symbol, type:'Stock',
        pnlAmt: calcPnl(h.pricePerShare, h.costBasis, h.quantity).pnlAmt,
        pnlPct: calcPnl(h.pricePerShare, h.costBasis, h.quantity).pnlPct,
      })),
      ...(data.crypto?.holdings??[]).map((h: any) => ({
        name: h.symbol, type:'Crypto',
        pnlAmt: calcPnl(h.pricePerUnit, h.costBasis, h.amount).pnlAmt,
        pnlPct: calcPnl(h.pricePerUnit, h.costBasis, h.amount).pnlPct,
      })),
    ].filter(h => h.pnlPct !== 0);

    if (allHoldings.length) {
      const sorted = [...allHoldings].sort((a,b)=>b.pnlPct-a.pnlPct);
      const best   = sorted[0];
      const worst  = sorted[sorted.length-1];

      const s4 = ws.addRow(['Best & Worst Investment','','','']); [1,2,3,4].forEach(i=>section(s4.getCell(i))); s4.height=24;
      const hr4 = ws.addRow(['Asset','Type','P&L $','P&L %']); [1,2,3,4].forEach(i=>header(hr4.getCell(i))); hr4.height=22;

      const br = ws.addRow([best.name, best.type, best.pnlAmt, best.pnlPct]);
      cell(br.getCell(1)); cell(br.getCell(2)); pnlMoney(br.getCell(3),best.pnlAmt); pnlPct(br.getCell(4),best.pnlPct); br.height=20;
      if (worst !== best) {
        const wr = ws.addRow([worst.name, worst.type, worst.pnlAmt, worst.pnlPct]);
        cell(wr.getCell(1),true); cell(wr.getCell(2),true); pnlMoney(wr.getCell(3),worst.pnlAmt); pnlPct(wr.getCell(4),worst.pnlPct); wr.height=20;
      }
      ws.addRow([]);
    }


    if (data.goals?.length) {
      const s5 = ws.addRow(['Goals Progress','','','']); [1,2,3,4].forEach(i=>section(s5.getCell(i))); s5.height=24;
      const hr5 = ws.addRow(['Goal','Progress','Status','Monthly Needed']); [1,2,3,4].forEach(i=>header(hr5.getCell(i))); hr5.height=22;
      (data.goals??[]).forEach((g: any, i: number) => {
        const status     = goalStatus(g);
        const dl         = new Date(g.deadline);
        const monthsLeft = Math.max(0.5, (dl.getTime()-Date.now())/(1000*60*60*24*30));
        const remaining  = (g.targetAmount??0)-(g.currentAmount??0);
        const needed     = remaining>0 ? remaining/monthsLeft : 0;
        const progress   = (g.progressPercent??0)/100;
        const r = ws.addRow([g.name??'', progress, status, needed]);
        cell(r.getCell(1),i%2===0);
        pct(r.getCell(2),{pos:progress>=0.75,neg:progress<0.25});
        statusBadge(r.getCell(3),status);
        money(r.getCell(4)); r.height=20;
      });
    }
  }


  private buildAssets(wb: ExcelJS.Workbook, assets: any[]) {
    const ws = wb.addWorksheet('Assets');
    ws.columns = [{ width:34 },{ width:14 },{ width:16 },{ width:12 }];

    const tr = ws.addRow(['Assets']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);
    const hr = ws.addRow(['Name','Type','Balance','Change %']); [1,2,3,4].forEach(i=>header(hr.getCell(i))); hr.height=22;

    assets.forEach((a,i) => {
      const chg = (a.changePercent??0)/100;
      const r = ws.addRow([a.name??'', a.type??'', a.balance??0, chg]);
      cell(r.getCell(1),i%2===0); cell(r.getCell(2),i%2===0);
      money(r.getCell(3),{alt:i%2===0});
      pct(r.getCell(4),{pos:chg>0,neg:chg<0,muted:chg===0}); r.height=20;
    });

    const tot = ws.addRow(['TOTAL','', assets.reduce((s,a)=>s+(a.balance??0),0), '']);
    totalRow(tot,4); money(tot.getCell(3),{}); tot.getCell(3).font={name:'Calibri',bold:true,size:12,color:{argb:DK}};
  }


  private buildTransactions(wb: ExcelJS.Workbook, txs: any[]) {
    const ws = wb.addWorksheet('Transactions');
    ws.columns = [{ width:13 },{ width:11 },{ width:16 },{ width:40 },{ width:13 }];

    const tr = ws.addRow(['Transactions']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);
    const hr = ws.addRow(['Date','Type','Category','Description','Amount']); [1,2,3,4,5].forEach(i=>header(hr.getCell(i))); hr.height=22;

    [...txs].sort((a,b)=>+new Date(b.date)-+new Date(a.date)).forEach((t,i) => {
      const inc = t.type==='Income';
      const alt = i%2===0;
      const r = ws.addRow([fmtDate(t.date), t.type??'', t.category??'', t.description??'', t.amount??0]);
      cell(r.getCell(1),alt); badge(r.getCell(2),inc); cell(r.getCell(3),alt); cell(r.getCell(4),alt);
      money(r.getCell(5),{pos:inc,neg:!inc}); r.height=18;
    });
  }


  private buildGoals(wb: ExcelJS.Workbook, goals: any[]) {
    const ws = wb.addWorksheet('Goals');
    ws.columns = [{ width:36 },{ width:13 },{ width:13 },{ width:13 },{ width:11 },{ width:13 },{ width:13 },{ width:14 }];

    const tr = ws.addRow(['Savings Goals']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);
    const hr = ws.addRow(['Goal','Target','Saved','Remaining','Progress','Status','Deadline','Monthly Needed']);
    [1,2,3,4,5,6,7,8].forEach(i=>header(hr.getCell(i))); hr.height=22;

    goals.forEach((g,i) => {
      const alt        = i%2===0;
      const remaining  = (g.targetAmount??0)-(g.currentAmount??0);
      const progress   = (g.progressPercent??0)/100;
      const status     = goalStatus(g);
      const dl         = new Date(g.deadline);
      const monthsLeft = Math.max(0.5,(dl.getTime()-Date.now())/(1000*60*60*24*30));
      const needed     = remaining>0 ? remaining/monthsLeft : 0;

      const r = ws.addRow([g.name??'', g.targetAmount??0, g.currentAmount??0, remaining, progress, status, g.deadline?fmtDate(g.deadline):'—', needed]);
      cell(r.getCell(1),alt);
      money(r.getCell(2),{alt}); money(r.getCell(3),{pos:true}); money(r.getCell(4),{alt});
      pct(r.getCell(5),{pos:progress>=0.75,neg:progress<0.25});
      statusBadge(r.getCell(6),status);
      cell(r.getCell(7),alt); rAlign(r.getCell(7),alt);
      money(r.getCell(8),{}); r.height=22;
    });
  }


  private buildStocks(wb: ExcelJS.Workbook, stocks: any) {
    const ws = wb.addWorksheet('Stocks');
    ws.columns = [{ width:10 },{ width:20 },{ width:10 },{ width:13 },{ width:13 },{ width:13 },{ width:13 },{ width:13 }];

    const tr = ws.addRow(['Stock Portfolio']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);

    const br = ws.addRow(['Total Balance', stocks.totalBalance??0]);
    label(br.getCell(1)); money(br.getCell(2),{big:true});
    const chgPct = (stocks.changePercent??0)/100;
    const chgR   = ws.addRow(['Today\'s Change', stocks.changeAmount??0, chgPct]);
    label(chgR.getCell(1)); money(chgR.getCell(2),{pos:chgPct>=0,neg:chgPct<0}); pct(chgR.getCell(3),{pos:chgPct>=0,neg:chgPct<0});

    ws.addRow([]);
    const hr = ws.addRow(['Symbol','Company','Qty','Cost Basis','Live Price','Value','P&L $','P&L %']);
    [1,2,3,4,5,6,7,8].forEach(i=>header(hr.getCell(i))); hr.height=22;

    let totVal=0, totPnl=0;
    (stocks.holdings??[]).forEach((h: any, i: number) => {
      const alt = i%2===0;
      const {pnlAmt,pnlPct: pnlP} = calcPnl(h.pricePerShare, h.costBasis, h.quantity);
      totVal += h.totalValue??0; totPnl += pnlAmt;

      const r = ws.addRow([h.symbol??'', h.companyName??'', h.quantity??0, h.costBasis??0, h.pricePerShare??0, h.totalValue??0, pnlAmt, pnlP]);
      const sc = r.getCell(1); cell(sc,alt); sc.font={name:'Calibri',bold:true,size:11,color:{argb:G.replace('FF','')}};
      cell(r.getCell(2),alt);
      rAlign(r.getCell(3),alt); r.getCell(3).numFmt='#,##0';
      money(r.getCell(4),{alt}); money(r.getCell(5),{alt});
      money(r.getCell(6),{alt});
      pnlMoney(r.getCell(7),pnlAmt); pnlPct(r.getCell(8),pnlP);
      r.height=20;
    });

    const tot = ws.addRow(['TOTAL','','','','', totVal, totPnl,'']);
    totalRow(tot,8);
    money(tot.getCell(6),{}); tot.getCell(6).font={name:'Calibri',bold:true,size:12,color:{argb:DK}};
    const pnlC = tot.getCell(7);
    money(pnlC,{pos:totPnl>=0,neg:totPnl<0}); pnlC.font={name:'Calibri',bold:true,size:12,color:{argb:totPnl>=0?GT:RT}};
    pnlC.fill={type:'pattern',pattern:'solid',fgColor:{argb:LG}};
  }


  private buildCrypto(wb: ExcelJS.Workbook, crypto: any) {
    const ws = wb.addWorksheet('Crypto');
    ws.columns = [{ width:10 },{ width:18 },{ width:12 },{ width:13 },{ width:13 },{ width:13 },{ width:13 },{ width:13 }];

    const tr = ws.addRow(['Crypto Portfolio']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);

    const br = ws.addRow(['Total Balance', crypto.totalBalance??0]);
    label(br.getCell(1)); money(br.getCell(2),{big:true});
    const chgPct = (crypto.changePercent??0)/100;
    const chgR   = ws.addRow(['Today\'s Change', crypto.changeAmount??0, chgPct]);
    label(chgR.getCell(1)); money(chgR.getCell(2),{pos:chgPct>=0,neg:chgPct<0}); pct(chgR.getCell(3),{pos:chgPct>=0,neg:chgPct<0});

    ws.addRow([]);
    const hr = ws.addRow(['Symbol','Name','Amount','Cost Basis','Live Price','Value','P&L $','P&L %']);
    [1,2,3,4,5,6,7,8].forEach(i=>header(hr.getCell(i))); hr.height=22;

    let totVal=0, totPnl=0;
    (crypto.holdings??[]).forEach((h: any, i: number) => {
      const alt = i%2===0;
      const {pnlAmt,pnlPct: pnlP} = calcPnl(h.pricePerUnit, h.costBasis, h.amount);
      totVal += h.totalValue??0; totPnl += pnlAmt;

      const r = ws.addRow([h.symbol??'', h.name??'', h.amount??0, h.costBasis??0, h.pricePerUnit??0, h.totalValue??0, pnlAmt, pnlP]);
      const sc = r.getCell(1); cell(sc,alt); sc.font={name:'Calibri',bold:true,size:11,color:{argb:G.replace('FF','')}};
      cell(r.getCell(2),alt);
      rAlign(r.getCell(3),alt); r.getCell(3).numFmt='#,##0.########';
      money(r.getCell(4),{alt}); money(r.getCell(5),{alt});
      money(r.getCell(6),{alt});
      pnlMoney(r.getCell(7),pnlAmt); pnlPct(r.getCell(8),pnlP);
      r.height=20;
    });

    const tot = ws.addRow(['TOTAL','','','','', totVal, totPnl,'']);
    totalRow(tot,8);
    money(tot.getCell(6),{}); tot.getCell(6).font={name:'Calibri',bold:true,size:12,color:{argb:DK}};
    const pnlC = tot.getCell(7);
    money(pnlC,{pos:totPnl>=0,neg:totPnl<0}); pnlC.font={name:'Calibri',bold:true,size:12,color:{argb:totPnl>=0?GT:RT}};
    pnlC.fill={type:'pattern',pattern:'solid',fgColor:{argb:LG}};
  }


  private buildCashflow(wb: ExcelJS.Workbook, pfm: any, transactions: any[]) {
    const ws = wb.addWorksheet('Cashflow');
    ws.columns = [{ width:13 },{ width:14 },{ width:14 },{ width:14 },{ width:13 },{ width:18 }];

    const tr = ws.addRow(['Monthly Cashflow']); title(tr.getCell(1)); tr.height=36;
    ws.addRow([]);
    const hr = ws.addRow(['Month','Income','Expenses','Net','Savings Rate','Top Category']);
    [1,2,3,4,5,6].forEach(i=>header(hr.getCell(i))); hr.height=22;


    const catMap: Record<string,{cat:string;amt:number}> = {};
    (transactions??[]).forEach((t: any) => {
      if (t.type!=='Expense') return;
      const d   = new Date(t.date);
      const key = d.toLocaleString('en',{month:'short',year:'numeric'});
      if (!catMap[key] || t.amount > catMap[key].amt)
        catMap[key] = { cat: t.category??'', amt: Math.abs(t.amount??0) };
    });

    const catAgg: Record<string,Record<string,number>> = {};
    (transactions??[]).forEach((t: any) => {
      if (t.type!=='Expense') return;
      const d   = new Date(t.date);
      const key = d.toLocaleString('en',{month:'short',year:'numeric'});
      if (!catAgg[key]) catAgg[key]={};
      catAgg[key][t.category] = (catAgg[key][t.category]||0)+Math.abs(t.amount??0);
    });

    let totInc=0, totExp=0;
    (pfm.cashflowData??[]).forEach((c: any, i: number) => {
      const alt  = i%2===0;
      const net  = (c.income??0)-(c.expenses??0);
      const rate = (c.income??0)>0 ? net/(c.income??1) : 0;
      totInc += c.income??0; totExp += c.expenses??0;


      const monthCats = catAgg[c.month]??{};
      const topCat    = Object.entries(monthCats).sort((a,b)=>b[1]-a[1])[0]?.[0]??'—';

      const r = ws.addRow([c.month??'', c.income??0, c.expenses??0, net, rate, topCat]);
      cell(r.getCell(1),alt);
      money(r.getCell(2),{pos:true}); money(r.getCell(3),{neg:true});
      money(r.getCell(4),{pos:net>=0,neg:net<0});
      pct(r.getCell(5),{pos:rate>=0.2,neg:rate<0,muted:rate===0});
      cell(r.getCell(6),alt); r.height=20;
    });

    const totNet  = totInc-totExp;
    const totRate = totInc>0 ? totNet/totInc : 0;
    const tot = ws.addRow(['TOTAL', totInc, totExp, totNet, totRate, '']);
    totalRow(tot,6);
    money(tot.getCell(2),{pos:true}); money(tot.getCell(3),{neg:true});
    money(tot.getCell(4),{pos:totNet>=0,neg:totNet<0});
    pct(tot.getCell(5),{pos:totRate>=0.2,neg:totRate<0});
    [2,3,4,5].forEach(i=>{ tot.getCell(i).font={name:'Calibri',bold:true,size:12,color:{argb:i===2?GT:i===3?RT:totNet>=0?GT:RT}}; });

    const count = (pfm.cashflowData??[]).length||1;
    const avg   = ws.addRow(['AVERAGE', totInc/count, totExp/count, totNet/count, totRate, '']);
    [1,2,3,4,5,6].forEach(i=>{ avg.getCell(i).fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF8FAFC'}}; avg.getCell(i).border=b(); });
    avg.getCell(1).font={name:'Calibri',bold:true,size:11,color:{argb:DK}};
    money(avg.getCell(2),{}); avg.getCell(2).numFmt='"$"#,##0.00';
    money(avg.getCell(3),{}); avg.getCell(4).numFmt='"$"#,##0.00';
    money(avg.getCell(4),{}); pct(avg.getCell(5),{muted:true});
    avg.height=20;
  }
}