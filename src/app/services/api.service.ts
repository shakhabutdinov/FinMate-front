import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  DashboardData, StockPortfolio, CryptoPortfolio,
  PfmOverview, Transaction, Goal, ChatMessage, PaymentConfig,
  StockHolding, CryptoHolding, BinanceStatus, BinanceAccountData, KlinePoint,
  AlpacaStatus, AlpacaAccountData, AlpacaBar, SubscriptionStatus
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = 'http://localhost:5100/api';

  constructor(private http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`);
  }

  getStockPortfolio() {
    return this.http.get<StockPortfolio>(`${this.baseUrl}/stocks`);
  }

  createStockHolding(data: { symbol: string; companyName: string; pricePerShare: number; quantity: number; color: string }) {
    return this.http.post<StockHolding>(`${this.baseUrl}/stocks`, data);
  }

  deleteStockHolding(id: string) {
    return this.http.delete(`${this.baseUrl}/stocks/${id}`);
  }

  getCryptoPortfolio() {
    return this.http.get<CryptoPortfolio>(`${this.baseUrl}/crypto`);
  }

  createCryptoHolding(data: { symbol: string; name: string; pricePerUnit: number; amount: number; color: string }) {
    return this.http.post<CryptoHolding>(`${this.baseUrl}/crypto`, data);
  }

  deleteCryptoHolding(id: string) {
    return this.http.delete(`${this.baseUrl}/crypto/${id}`);
  }

  getPfmOverview() {
    return this.http.get<PfmOverview>(`${this.baseUrl}/pfm/overview`);
  }

  getTransactions(limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    return this.http.get<Transaction[]>(`${this.baseUrl}/pfm/transactions${params}`);
  }

  createTransaction(data: { type: string; category: string; amount: number; description: string; date?: string }) {
    return this.http.post<Transaction>(`${this.baseUrl}/pfm/transactions`, data);
  }

  getGoals() {
    return this.http.get<Goal[]>(`${this.baseUrl}/pfm/goals`);
  }

  createGoal(data: { name: string; targetAmount: number; currentAmount: number; deadline?: string }) {
    return this.http.post<Goal>(`${this.baseUrl}/pfm/goals`, data);
  }

  getChatHistory() {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/ai/history`);
  }

  sendMessage(content: string) {
    return this.http.post<ChatMessage>(`${this.baseUrl}/ai/message`, { content });
  }

  getQuickQuestions() {
    return this.http.get<string[]>(`${this.baseUrl}/ai/quick-questions`);
  }

  clearChatHistory() {
    return this.http.delete(`${this.baseUrl}/ai/history`);
  }

  getPaymentConfig() {
    return this.http.get<PaymentConfig>(`${this.baseUrl}/payment/config`);
  }

  getBinanceStatus() {
    return this.http.get<BinanceStatus>(`${this.baseUrl}/binance/status`);
  }

  connectBinance(apiKey: string, secretKey: string) {
    return this.http.post<BinanceAccountData>(`${this.baseUrl}/binance/connect`, { apiKey, secretKey });
  }

  getBinanceAccount() {
    return this.http.get<BinanceAccountData>(`${this.baseUrl}/binance/account`);
  }

  disconnectBinance() {
    return this.http.delete(`${this.baseUrl}/binance/disconnect`);
  }

  getBinanceKlines(symbol: string, interval = '1d', limit = 30) {
    return this.http.get<KlinePoint[]>(`${this.baseUrl}/binance/klines/${symbol}?interval=${interval}&limit=${limit}`);
  }

  getAlpacaStatus() {
    return this.http.get<AlpacaStatus>(`${this.baseUrl}/alpaca/status`);
  }

  connectAlpaca(apiKey: string, secretKey: string, isPaper = true) {
    return this.http.post<AlpacaAccountData>(`${this.baseUrl}/alpaca/connect`, { apiKey, secretKey, isPaper });
  }

  getAlpacaAccount() {
    return this.http.get<AlpacaAccountData>(`${this.baseUrl}/alpaca/account`);
  }

  disconnectAlpaca() {
    return this.http.delete(`${this.baseUrl}/alpaca/disconnect`);
  }

  getAlpacaBars(symbol: string, timeframe = '1Day', limit = 30) {
    return this.http.get<AlpacaBar[]>(`${this.baseUrl}/alpaca/bars/${symbol}?timeframe=${timeframe}&limit=${limit}`);
  }

  getSubscriptionStatus() {
    return this.http.get<SubscriptionStatus>(`${this.baseUrl}/subscription/status`);
  }

  activateSubscription(paymentToken: string, paymentMethod: string) {
    return this.http.post<SubscriptionStatus>(`${this.baseUrl}/subscription/activate`, { paymentToken, paymentMethod });
  }
}
