import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse, SubscriptionStatus } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5100/api/auth';
  private readonly tokenKey = 'finmate_token';
  private readonly userKey = 'finmate_user';

  currentUser = signal<AuthResponse | null>(this.loadUser());
  isAuthenticated = computed(() => !!this.currentUser());

  subscriptionStatus = signal<SubscriptionStatus | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password });
  }

  register(email: string, password: string, firstName: string, lastName: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password, firstName, lastName });
  }

  googleLogin(idToken: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { idToken });
  }

  handleAuthSuccess(response: AuthResponse) {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response));
    this.currentUser.set(response);
    this.router.navigate(['/dashboard']);
  }

  refreshSubscription() {
    this.http.get<SubscriptionStatus>('http://localhost:5100/api/subscription/status').subscribe({
      next: (status) => this.subscriptionStatus.set(status),
      error: () => {}
    });
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
    this.subscriptionStatus.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private loadUser(): AuthResponse | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }
}
