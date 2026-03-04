import { Component, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { SubscriptionStatus } from '../../models/api.models';

declare var google: any;

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <h1 class="text-lg font-bold text-white tracking-wide">{{ title() }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </button>
        <button class="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors relative">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
          <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00FF88] rounded-full"></span>
        </button>
        <button (click)="showAccountPanel = !showAccountPanel" class="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center text-black font-bold text-sm hover:ring-2 hover:ring-[#00FF88]/50 transition-all">
          {{ authService.currentUser()?.initials || 'U' }}
        </button>
      </div>
    </div>

    <!-- Account Panel Overlay -->
    @if (showAccountPanel) {
      <div class="fixed inset-0 z-50" (click)="showAccountPanel = false">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div class="absolute top-0 right-0 w-full max-w-[430px] mx-auto left-0" (click)="$event.stopPropagation()">
          <div class="m-3 mt-14 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

            <!-- User Info -->
            <div class="p-5 border-b border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00FF88] to-emerald-600 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">
                  {{ authService.currentUser()?.initials || 'U' }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-white font-semibold truncate">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</div>
                  <div class="text-gray-400 text-sm truncate">{{ authService.currentUser()?.email }}</div>
                </div>
              </div>
            </div>

            <!-- Subscription Status -->
            <div class="p-5 border-b border-gray-800">
              @if (subStatus(); as sub) {
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      [class]="sub.isActive
                        ? (sub.isTrial ? 'bg-blue-500/20 text-blue-400' : 'bg-[#00FF88]/20 text-[#00FF88]')
                        : 'bg-red-500/20 text-red-400'">
                      {{ sub.planName }}
                    </span>
                    @if (sub.isActive) {
                      <span class="text-xs text-gray-400">{{ sub.daysRemaining }} days left</span>
                    }
                  </div>
                  @if (sub.isActive) {
                    <div class="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
                  } @else {
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                  }
                </div>

                <!-- Progress bar for trial/subscription -->
                @if (sub.isActive) {
                  <div class="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
                    <div class="h-full rounded-full transition-all"
                      [style.width.%]="(sub.daysRemaining / 30) * 100"
                      [class]="sub.isTrial ? 'bg-blue-500' : 'bg-[#00FF88]'"></div>
                  </div>
                }

                @if (!sub.isActive || sub.isTrial) {
                  <button (click)="activateWithGooglePay()"
                    [disabled]="activating"
                    class="w-full flex items-center justify-center gap-2 h-10 rounded-xl font-medium text-sm transition-all"
                    [class]="sub.isActive
                      ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                      : 'bg-[#00FF88] hover:bg-[#00FF88]/90 text-black'">
                    @if (activating) {
                      <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    } @else {
                      <svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor">
                        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                      </svg>
                      {{ sub.isActive ? 'Upgrade to Premium' : 'Activate with Google Pay' }}
                    }
                  </button>
                  @if (payError) {
                    <div class="text-red-400 text-xs mt-2">{{ payError }}</div>
                  }
                }
              } @else {
                <div class="flex items-center justify-center py-2">
                  <div class="w-4 h-4 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin"></div>
                </div>
              }
            </div>

            <!-- Actions -->
            <div class="p-2">
              <button (click)="logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors text-left">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span class="text-red-400 text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
  `]
})
export class TopNavbarComponent implements OnInit {
  title = input<string>('Dashboard');
  showAccountPanel = false;
  activating = false;
  payError = '';

  subStatus = signal<SubscriptionStatus | null>(null);

  constructor(public authService: AuthService, private api: ApiService) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.loadSubscription();
    }
  }

  logout() {
    this.showAccountPanel = false;
    this.authService.logout();
  }

  activateWithGooglePay() {
    this.activating = true;
    this.payError = '';

    if (typeof google === 'undefined' || !google.payments) {
      this.processPayment('gpay_simulated_token');
      return;
    }

    try {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST'
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example',
              gatewayMerchantId: 'exampleGatewayMerchantId'
            }
          }
        }],
        merchantInfo: {
          merchantId: 'BCR2DN4T7OL6JMGF',
          merchantName: 'FinMate'
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: '9.99',
          currencyCode: 'USD',
          countryCode: 'US'
        }
      };

      paymentsClient.loadPaymentData(paymentDataRequest)
        .then((paymentData: any) => {
          const token = paymentData.paymentMethodData.tokenizationData.token;
          this.processPayment(token);
        })
        .catch(() => {
          this.activating = false;
          this.payError = 'Payment was cancelled.';
        });
    } catch {
      this.processPayment('gpay_simulated_token');
    }
  }

  private processPayment(token: string) {
    this.api.activateSubscription(token, 'google_pay').subscribe({
      next: (status) => {
        this.subStatus.set(status);
        this.authService.subscriptionStatus.set(status);
        this.activating = false;

        const user = this.authService.currentUser();
        if (user) {
          const updated = { ...user, subscriptionEndDate: status.subscriptionEndDate, isActive: status.isActive, daysRemaining: status.daysRemaining };
          this.authService.currentUser.set(updated);
          localStorage.setItem('finmate_user', JSON.stringify(updated));
        }
      },
      error: (err) => {
        this.payError = err.error?.error || 'Payment failed. Please try again.';
        this.activating = false;
      }
    });
  }

  private loadSubscription() {
    this.api.getSubscriptionStatus().subscribe({
      next: (status) => {
        this.subStatus.set(status);
        this.authService.subscriptionStatus.set(status);
      },
      error: () => {}
    });
  }
}
