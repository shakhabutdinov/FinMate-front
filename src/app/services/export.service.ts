import { Injectable } from '@angular/core';
import { forkJoin, of, catchError, map } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

type CellType = 'String' | 'Number';
interface Cell { value: any; type?: CellType; styleId?: string; formula?: string; }
interface Sheet { name: string; columns: number[]; rows: Cell[][]; }

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor(private api: ApiService, private auth: AuthService) {}

  exportAllAsExcel() {
    const safe = <T>(obs: any, fallback: T) =>
      (obs as any).pipe(catchError(() => of(fallback)));

    return forkJoin({
      dashboard: safe(this.api.getDashboard(), null),
      transactions: safe(this.api.getTransactions(), []),
      goals: safe(this.api.getGoals(), []),
      stocks: safe(this.api.getStockPortfolio(), null),
      crypto: safe(this.api.getCryptoPortfolio(), null),
      pfm: safe(this.api.getPfmOverview(), null)
    }).pipe(
      map((data: any) => {
        const xml = this.buildWorkbook(data);
        this.triggerDownload(xml);
        return true;
      })
    );
  }

  // ============ Workbook construction ============

  private buildWorkbook(data: any): string {
    const sheets: Sheet[] = [];
    sheets.push(this.buildSummarySheet(data));
    if (data.dashboard?.assets?.length) sheets.push(this.buildAssetsSheet(data.dashboard.assets));
    if (data.transactions?.length) sheets.push(this.buildTransactionsSheet(data.transactions));
    if (data.goals?.length) sheets.push(this.buildGoalsSheet(data.goals));
    if (data.stocks?.holdings?.length) sheets.push(this.buildStocksSheet(data.stocks));
    if (data.crypto?.holdings?.length) sheets.push(this.buildCryptoSheet(data.crypto));
    if (data.pfm?.cashflowData?.length) sheets.push(this.buildCashflowSheet(data.pfm));

    return this.renderWorkbook(sheets);
  }

  private buildSummarySheet(data: any): Sheet {
    const user = this.auth.currentUser();
    const rows: Cell[][] = [];

    rows.push([{ value: 'FinMate Financial Report', styleId: 'sTitle' }]);
    rows.push([{ value: '', styleId: 'sSubtle' }]);
    rows.push([
      { value: 'Generated', styleId: 'sLabel' },
      { value: new Date().toLocaleString(), styleId: 'sValue' }
    ]);
    if (user) {
      rows.push([
        { value: 'Account', styleId: 'sLabel' },
        { value: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '—', styleId: 'sValue' }
      ]);
      rows.push([
        { value: 'Email', styleId: 'sLabel' },
        { value: user.email ?? '', styleId: 'sValue' }
      ]);
    }
    rows.push([{ value: '' }]);

    if (data.dashboard) {
      rows.push([{ value: 'Portfolio Overview', styleId: 'sSection' }, { value: '', styleId: 'sSection' }]);
      rows.push([
        { value: 'Total Balance', styleId: 'sLabel' },
        { value: data.dashboard.totalBalance ?? 0, type: 'Number', styleId: 'sMoneyBig' }
      ]);
      rows.push([
        { value: 'Change Amount (1mo)', styleId: 'sLabel' },
        { value: data.dashboard.changeAmount ?? 0, type: 'Number', styleId: 'sMoney' }
      ]);
      rows.push([
        { value: 'Change Percent (1mo)', styleId: 'sLabel' },
        { value: (data.dashboard.changePercent ?? 0) / 100, type: 'Number', styleId: 'sPercent' }
      ]);
      rows.push([{ value: '' }]);
    }

    if (data.pfm) {
      rows.push([{ value: 'This Month', styleId: 'sSection' }, { value: '', styleId: 'sSection' }]);
      rows.push([
        { value: 'Income MTD', styleId: 'sLabel' },
        { value: data.pfm.incomeMtd ?? 0, type: 'Number', styleId: 'sMoneyPos' }
      ]);
      rows.push([
        { value: 'Expenses MTD', styleId: 'sLabel' },
        { value: data.pfm.expensesMtd ?? 0, type: 'Number', styleId: 'sMoneyNeg' }
      ]);
      rows.push([
        { value: 'Net MTD', styleId: 'sLabel' },
        { value: (data.pfm.incomeMtd ?? 0) - (data.pfm.expensesMtd ?? 0), type: 'Number', styleId: 'sMoney' }
      ]);
      rows.push([{ value: '' }]);
    }

    rows.push([{ value: 'Sheets in this workbook', styleId: 'sSection' }, { value: '', styleId: 'sSection' }]);
    rows.push([
      { value: 'Sheet', styleId: 'sHeader' },
      { value: 'Description', styleId: 'sHeader' }
    ]);
    const tabs = [
      ['Summary', 'Top-level snapshot of accounts and totals'],
      ['Assets', 'Each asset, balance and short-term change'],
      ['Transactions', 'Full income/expense ledger'],
      ['Goals', 'Savings goals and progress'],
      ['Stocks', 'Stock holdings and valuations'],
      ['Crypto', 'Crypto holdings and valuations'],
      ['Cashflow', 'Monthly income vs expenses']
    ];
    for (const [n, d] of tabs) {
      rows.push([
        { value: n, styleId: 'sLabel' },
        { value: d, styleId: 'sValue' }
      ]);
    }

    return { name: 'Summary', columns: [180, 320], rows };
  }

  private buildAssetsSheet(assets: any[]): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Assets', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Name', styleId: 'sHeader' },
      { value: 'Type', styleId: 'sHeader' },
      { value: 'Balance', styleId: 'sHeader' },
      { value: 'Change %', styleId: 'sHeader' }
    ]);
    for (const a of assets) {
      rows.push([
        { value: a.name ?? '', styleId: 'sCell' },
        { value: a.type ?? '', styleId: 'sCell' },
        { value: a.balance ?? 0, type: 'Number', styleId: 'sMoney' },
        { value: (a.changePercent ?? 0) / 100, type: 'Number', styleId: a.changePercent >= 0 ? 'sPercentPos' : 'sPercentNeg' }
      ]);
    }
    return { name: 'Assets', columns: [200, 110, 130, 110], rows };
  }

  private buildTransactionsSheet(txs: any[]): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Transactions', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Date', styleId: 'sHeader' },
      { value: 'Type', styleId: 'sHeader' },
      { value: 'Category', styleId: 'sHeader' },
      { value: 'Description', styleId: 'sHeader' },
      { value: 'Amount', styleId: 'sHeader' }
    ]);
    const sorted = [...txs].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    for (const t of sorted) {
      const isIncome = t.type === 'Income';
      rows.push([
        { value: this.fmtDate(t.date), styleId: 'sCell' },
        { value: t.type ?? '', styleId: isIncome ? 'sBadgeIncome' : 'sBadgeExpense' },
        { value: t.category ?? '', styleId: 'sCell' },
        { value: t.description ?? '', styleId: 'sCell' },
        { value: t.amount ?? 0, type: 'Number', styleId: isIncome ? 'sMoneyPos' : 'sMoneyNeg' }
      ]);
    }
    return { name: 'Transactions', columns: [110, 90, 130, 260, 120], rows };
  }

  private buildGoalsSheet(goals: any[]): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Savings Goals', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Name', styleId: 'sHeader' },
      { value: 'Target', styleId: 'sHeader' },
      { value: 'Saved', styleId: 'sHeader' },
      { value: 'Remaining', styleId: 'sHeader' },
      { value: 'Progress', styleId: 'sHeader' },
      { value: 'Deadline', styleId: 'sHeader' }
    ]);
    for (const g of goals) {
      const remaining = (g.targetAmount ?? 0) - (g.currentAmount ?? 0);
      rows.push([
        { value: g.name ?? '', styleId: 'sCell' },
        { value: g.targetAmount ?? 0, type: 'Number', styleId: 'sMoney' },
        { value: g.currentAmount ?? 0, type: 'Number', styleId: 'sMoneyPos' },
        { value: remaining, type: 'Number', styleId: 'sMoney' },
        { value: (g.progressPercent ?? 0) / 100, type: 'Number', styleId: 'sPercentPos' },
        { value: g.deadline ? this.fmtDate(g.deadline) : '—', styleId: 'sCell' }
      ]);
    }
    return { name: 'Goals', columns: [200, 130, 130, 130, 110, 130], rows };
  }

  private buildStocksSheet(stocks: any): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Stock Portfolio', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Total Balance', styleId: 'sLabel' },
      { value: stocks.totalBalance ?? 0, type: 'Number', styleId: 'sMoneyBig' }
    ]);
    rows.push([
      { value: 'Change', styleId: 'sLabel' },
      { value: stocks.changeAmount ?? 0, type: 'Number', styleId: 'sMoney' },
      { value: (stocks.changePercent ?? 0) / 100, type: 'Number', styleId: stocks.changePercent >= 0 ? 'sPercentPos' : 'sPercentNeg' }
    ]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Symbol', styleId: 'sHeader' },
      { value: 'Company', styleId: 'sHeader' },
      { value: 'Quantity', styleId: 'sHeader' },
      { value: 'Price / Share', styleId: 'sHeader' },
      { value: 'Total Value', styleId: 'sHeader' }
    ]);
    for (const h of stocks.holdings ?? []) {
      rows.push([
        { value: h.symbol ?? '', styleId: 'sCell' },
        { value: h.companyName ?? '', styleId: 'sCell' },
        { value: h.quantity ?? 0, type: 'Number', styleId: 'sNumber' },
        { value: h.pricePerShare ?? 0, type: 'Number', styleId: 'sMoney' },
        { value: h.totalValue ?? 0, type: 'Number', styleId: 'sMoney' }
      ]);
    }
    return { name: 'Stocks', columns: [110, 240, 110, 130, 140], rows };
  }

  private buildCryptoSheet(crypto: any): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Crypto Portfolio', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Total Balance', styleId: 'sLabel' },
      { value: crypto.totalBalance ?? 0, type: 'Number', styleId: 'sMoneyBig' }
    ]);
    rows.push([
      { value: 'Change', styleId: 'sLabel' },
      { value: crypto.changeAmount ?? 0, type: 'Number', styleId: 'sMoney' },
      { value: (crypto.changePercent ?? 0) / 100, type: 'Number', styleId: crypto.changePercent >= 0 ? 'sPercentPos' : 'sPercentNeg' }
    ]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Symbol', styleId: 'sHeader' },
      { value: 'Name', styleId: 'sHeader' },
      { value: 'Amount', styleId: 'sHeader' },
      { value: 'Price / Unit', styleId: 'sHeader' },
      { value: 'Total Value', styleId: 'sHeader' }
    ]);
    for (const h of crypto.holdings ?? []) {
      rows.push([
        { value: h.symbol ?? '', styleId: 'sCell' },
        { value: h.name ?? '', styleId: 'sCell' },
        { value: h.amount ?? 0, type: 'Number', styleId: 'sNumber' },
        { value: h.pricePerUnit ?? 0, type: 'Number', styleId: 'sMoney' },
        { value: h.totalValue ?? 0, type: 'Number', styleId: 'sMoney' }
      ]);
    }
    return { name: 'Crypto', columns: [110, 240, 110, 130, 140], rows };
  }

  private buildCashflowSheet(pfm: any): Sheet {
    const rows: Cell[][] = [];
    rows.push([{ value: 'Cashflow', styleId: 'sTitle' }]);
    rows.push([{ value: '' }]);
    rows.push([
      { value: 'Month', styleId: 'sHeader' },
      { value: 'Income', styleId: 'sHeader' },
      { value: 'Expenses', styleId: 'sHeader' },
      { value: 'Net', styleId: 'sHeader' }
    ]);
    for (const c of pfm.cashflowData ?? []) {
      rows.push([
        { value: c.month ?? '', styleId: 'sCell' },
        { value: c.income ?? 0, type: 'Number', styleId: 'sMoneyPos' },
        { value: c.expenses ?? 0, type: 'Number', styleId: 'sMoneyNeg' },
        { value: (c.income ?? 0) - (c.expenses ?? 0), type: 'Number', styleId: 'sMoney' }
      ]);
    }
    return { name: 'Cashflow', columns: [120, 130, 130, 130], rows };
  }

  // ============ SpreadsheetML 2003 rendering ============

  private renderWorkbook(sheets: Sheet[]): string {
    return [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<?mso-application progid="Excel.Sheet"?>`,
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`,
      ` xmlns:o="urn:schemas-microsoft-com:office:office"`,
      ` xmlns:x="urn:schemas-microsoft-com:office:excel"`,
      ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"`,
      ` xmlns:html="http://www.w3.org/TR/REC-html40">`,
      this.renderStyles(),
      ...sheets.map(s => this.renderSheet(s)),
      `</Workbook>`
    ].join('');
  }

  private renderStyles(): string {
    const style = (id: string, body: string) => `<Style ss:ID="${id}">${body}</Style>`;
    const font = (size: number, bold = false, color = '#1F2937') =>
      `<Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="${size}" ${bold ? 'ss:Bold="1"' : ''} ss:Color="${color}"/>`;
    const interior = (color: string) => `<Interior ss:Color="${color}" ss:Pattern="Solid"/>`;
    const border = `<Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E5E7EB"/></Borders>`;
    const alignLeft = `<Alignment ss:Vertical="Center" ss:Horizontal="Left"/>`;
    const alignRight = `<Alignment ss:Vertical="Center" ss:Horizontal="Right"/>`;
    const alignCenter = `<Alignment ss:Vertical="Center" ss:Horizontal="Center"/>`;
    const moneyFmt = `<NumberFormat ss:Format="&quot;$&quot;#,##0.00;[Red]-&quot;$&quot;#,##0.00"/>`;
    const moneyBigFmt = `<NumberFormat ss:Format="&quot;$&quot;#,##0;[Red]-&quot;$&quot;#,##0"/>`;
    const percentFmt = `<NumberFormat ss:Format="0.00%;[Red]-0.00%"/>`;
    const numberFmt = `<NumberFormat ss:Format="#,##0.0000"/>`;

    return `<Styles>
      <Style ss:ID="Default" ss:Name="Normal">${font(11)}${alignLeft}</Style>
      ${style('sTitle', `${font(20, true, '#0F172A')}${interior('#ECFDF5')}<Alignment ss:Vertical="Center" ss:Horizontal="Left"/>`)}
      ${style('sSection', `${font(13, true, '#FFFFFF')}${interior('#10B981')}${alignLeft}`)}
      ${style('sHeader', `${font(11, true, '#FFFFFF')}${interior('#0F172A')}${alignCenter}${border}`)}
      ${style('sLabel', `${font(11, true, '#0F172A')}${interior('#F8FAFC')}${alignLeft}${border}`)}
      ${style('sValue', `${font(11, false, '#0F172A')}${alignLeft}${border}`)}
      ${style('sCell', `${font(11, false, '#1F2937')}${alignLeft}${border}`)}
      ${style('sNumber', `${font(11, false, '#1F2937')}${alignRight}${border}${numberFmt}`)}
      ${style('sMoney', `${font(11, false, '#0F172A')}${alignRight}${border}${moneyFmt}`)}
      ${style('sMoneyBig', `${font(14, true, '#0F172A')}${interior('#ECFDF5')}${alignRight}${border}${moneyBigFmt}`)}
      ${style('sMoneyPos', `${font(11, true, '#047857')}${alignRight}${border}${moneyFmt}`)}
      ${style('sMoneyNeg', `${font(11, true, '#B91C1C')}${alignRight}${border}${moneyFmt}`)}
      ${style('sPercent', `${font(11, false, '#1F2937')}${alignRight}${border}${percentFmt}`)}
      ${style('sPercentPos', `${font(11, true, '#047857')}${interior('#ECFDF5')}${alignRight}${border}${percentFmt}`)}
      ${style('sPercentNeg', `${font(11, true, '#B91C1C')}${interior('#FEF2F2')}${alignRight}${border}${percentFmt}`)}
      ${style('sBadgeIncome', `${font(10, true, '#047857')}${interior('#ECFDF5')}${alignCenter}${border}`)}
      ${style('sBadgeExpense', `${font(10, true, '#B91C1C')}${interior('#FEF2F2')}${alignCenter}${border}`)}
      ${style('sSubtle', `${font(10, false, '#64748B')}${alignLeft}`)}
    </Styles>`;
  }

  private renderSheet(sheet: Sheet): string {
    const cols = sheet.columns.map(w => `<Column ss:Width="${w}"/>`).join('');
    const rows = sheet.rows.map(r => this.renderRow(r)).join('');
    const safeName = sheet.name.replace(/[\\\/\?\*\[\]:]/g, '_').slice(0, 31);
    return `<Worksheet ss:Name="${safeName}"><Table>${cols}${rows}</Table>
      <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
        <FreezePanes/><FrozenNoSplit/>
      </WorksheetOptions>
    </Worksheet>`;
  }

  private renderRow(cells: Cell[]): string {
    if (!cells.length) return '<Row/>';
    return `<Row>${cells.map(c => this.renderCell(c)).join('')}</Row>`;
  }

  private renderCell(cell: Cell): string {
    const styleAttr = cell.styleId ? ` ss:StyleID="${cell.styleId}"` : '';
    if (cell.value === null || cell.value === undefined || cell.value === '') {
      return `<Cell${styleAttr}/>`;
    }
    const t = cell.type ?? 'String';
    const v = t === 'Number' ? Number(cell.value) : this.escapeXml(String(cell.value));
    return `<Cell${styleAttr}><Data ss:Type="${t}">${v}</Data></Cell>`;
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private fmtDate(d: string | Date): string {
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch { return String(d); }
  }

  private triggerDownload(xml: string) {
    const blob = new Blob(['﻿', xml], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `finmate-export-${stamp}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
