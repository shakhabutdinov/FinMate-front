import { Component, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-full flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="mb-4 flex justify-center">
            <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#00FF88]/20">
              <span class="text-4xl font-bold text-black">F</span>
            </div>
          </div>
          <h1 class="text-3xl mb-2 text-white font-bold">Finmate</h1>
          <p class="text-gray-400">Sign in to your account</p>
        </div>
        <div class="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-800 p-8">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="space-y-3">
              <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                <input type="email" formControlName="email" placeholder="Email" class="w-full pl-11 h-12 bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00FF88] focus:border-[#00FF88] transition-all">
              </div>
              <div class="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" formControlName="password" placeholder="Password" class="w-full pl-11 h-12 bg-gray-800/50 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00FF88] focus:border-[#00FF88] transition-all">
              </div>
            </div>
            <button type="button" class="text-sm text-[#00FF88] hover:text-[#00FF88]/80 transition-colors">Forgot password?</button>

            @if (error) {
              <div class="text-red-400 text-sm text-center">{{ error }}</div>
            }

            <button type="submit" [disabled]="loginForm.invalid || loading" class="w-full h-12 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {{ loading ? 'Signing in...' : 'Sign In' }}
              @if (!loading) {
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              }
            </button>

            <div class="relative my-6">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-700"></div></div>
              <div class="relative flex justify-center text-sm"><span class="px-4 bg-gray-900/80 text-gray-500">or</span></div>
            </div>

            <button type="button" (click)="signInWithGoogle()" [disabled]="googleLoading"
              class="w-full h-12 border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50">
              @if (googleLoading) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              } @else {
                <svg class="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              }
            </button>
          </form>
          <p class="text-center text-sm text-gray-400 mt-6">Don't have an account? <a routerLink="/auth/register" class="text-[#00FF88] hover:text-[#00FF88]/80 transition-colors">Sign up</a></p>
        </div>
        <p class="text-center text-sm text-gray-500 mt-6">By continuing, you agree to Finmate's Terms of Service and Privacy Policy</p>
      </div>
    </div>
  `
})
export class LoginComponent implements AfterViewInit {
  loginForm;
  loading = false;
  googleLoading = false;
  error = '';

  private googleClientId = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngAfterViewInit() {
    this.initializeGoogleSignIn();
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email!, password!).subscribe({
      next: (res) => {
        this.authService.handleAuthSuccess(res);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Login failed';
        this.loading = false;
      }
    });
  }

  signInWithGoogle() {
    if (typeof google === 'undefined' || !google.accounts) {
      this.error = 'Google Sign-In is not available. Please try again later.';
      return;
    }

    this.googleLoading = true;
    this.error = '';

    try {
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          this.ngZone.run(() => {
            this.googleLoading = false;
            this.error = 'Google Sign-In popup was blocked or dismissed. Please allow popups and try again.';
          });
        }
      });
    } catch {
      this.googleLoading = false;
      this.error = 'Failed to initialize Google Sign-In.';
    }
  }

  private initializeGoogleSignIn() {
    const checkGoogleReady = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogleReady);
        google.accounts.id.initialize({
          client_id: this.googleClientId,
          callback: (response: any) => this.handleGoogleCallback(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    }, 100);

    setTimeout(() => clearInterval(checkGoogleReady), 10000);
  }

  private handleGoogleCallback(response: any) {
    this.ngZone.run(() => {
      this.googleLoading = true;
      this.error = '';

      this.authService.googleLogin(response.credential).subscribe({
        next: (res) => {
          this.authService.handleAuthSuccess(res);
          this.googleLoading = false;
        },
        error: (err) => {
          this.error = err.error?.error || 'Google login failed. Please try again.';
          this.googleLoading = false;
        }
      });
    });
  }
}
