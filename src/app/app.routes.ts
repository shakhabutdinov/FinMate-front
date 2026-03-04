import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'auth/login', loadComponent: () => import('./components/auth/login').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./components/auth/register').then(m => m.RegisterComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'stocks', loadComponent: () => import('./components/stocks/stocks').then(m => m.StocksComponent), canActivate: [authGuard] },
  { path: 'crypto', loadComponent: () => import('./components/crypto/crypto').then(m => m.CryptoComponent), canActivate: [authGuard] },
  { path: 'pfm', loadComponent: () => import('./components/pfm/pfm').then(m => m.PfmComponent), canActivate: [authGuard] },
  { path: 'ai', loadComponent: () => import('./components/ai/ai').then(m => m.AiComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
