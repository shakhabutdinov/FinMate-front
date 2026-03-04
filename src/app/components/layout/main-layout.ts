import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavbarComponent } from './top-navbar';
import { BottomNavComponent } from './bottom-nav';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, TopNavbarComponent, BottomNavComponent],
  template: `
    <div class="h-full relative flex flex-col">
      <div class="flex-shrink-0">
        <app-top-navbar [title]="pageTitle()" />
      </div>
      <div class="flex-1 overflow-y-auto pb-20">
        <ng-content />
      </div>
      <app-bottom-nav [activePage]="activePage()" />
    </div>
  `
})
export class MainLayoutComponent {
  pageTitle = input<string>('Dashboard');
  activePage = input<string>('main');
}
