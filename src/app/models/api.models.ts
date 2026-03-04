export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  initials: string;
  trialEndDate: string;
  subscriptionEndDate: string | null;
  isActive: boolean;
  daysRemaining: number;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  daysRemaining: number;
  trialEndDate: string;
  subscriptionEndDate: string | null;
  planName: string;
}

export interface DashboardData {
  totalBalance: number;
  changePercent: number;
  changeAmount: number;
  assets: Asset[];
  quickActions: QuickAction[];
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  balance: number;
  changePercent: number;
  icon: string;
  sparklineData: number[];
}

export interface QuickAction {
  name: string;
  icon: string;
}

export interface StockPortfolio {
  totalBalance: number;
  changeAmount: number;
  changePercent: number;
  holdings: StockHolding[];
  trending: TrendingStock[];
}

export interface StockHolding {
  id: string;
  symbol: string;
  companyName: string;
  pricePerShare: number;
  quantity: number;
  totalValue: number;
  color: string;
}

export interface TrendingStock {
  symbol: string;
  price: number;
  changePercent: number;
  chartData: number[];
}

export interface CryptoPortfolio {
  totalBalance: number;
  changeAmount: number;
  changePercent: number;
  holdings: CryptoHolding[];
  trending: TrendingCrypto[];
}

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  pricePerUnit: number;
  amount: number;
  totalValue: number;
  color: string;
}

export interface TrendingCrypto {
  symbol: string;
  price: number;
  changePercent: number;
  chartData: number[];
}

export interface PfmOverview {
  incomeMtd: number;
  expensesMtd: number;
  cashflowData: CashflowData[];
  expenseSegments: ExpenseSegment[];
  totalExpenses: number;
}

export interface CashflowData {
  month: string;
  income: number;
  expenses: number;
}

export interface ExpenseSegment {
  category: string;
  amount: number;
  color: string;
}

export interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  progressPercent: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  isFromAI: boolean;
  createdAt: string;
}

export interface PaymentConfig {
  merchantId: string;
  merchantName: string;
  environment: string;
}

export interface BinanceStatus {
  isConnected: boolean;
  connectedAt: string | null;
}

export interface BinanceAccountData {
  isConnected: boolean;
  connectedAt: string | null;
  totalBalanceUsdt: number;
  assets: BinanceAsset[];
}

export interface BinanceAsset {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdtValue: number;
}

export interface KlinePoint {
  time: number;
  close: number;
}

export interface AlpacaStatus {
  isConnected: boolean;
  connectedAt: string | null;
  isPaper: boolean;
}

export interface AlpacaAccountData {
  isConnected: boolean;
  connectedAt: string | null;
  equity: number;
  cash: number;
  buyingPower: number;
  longMarketValue: number;
  accountStatus: string;
  isPaper: boolean;
  positions: AlpacaPosition[];
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPl: number;
  unrealizedPlPc: number;
  changeToday: number;
}

export interface AlpacaBar {
  time: number;
  close: number;
}
