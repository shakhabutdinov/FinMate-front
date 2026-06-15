import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavbarComponent } from './top-navbar';
import { BottomNavComponent } from './bottom-nav';
import { SideNavComponent } from './side-nav';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, TopNavbarComponent, BottomNavComponent, SideNavComponent],
  template: `
    <div class="h-full relative flex">

      <app-side-nav [activePage]="activePage()" />


      <div class="flex-1 min-w-0 flex flex-col h-full">
        <div class="flex-shrink-0">
          <app-top-navbar [title]="pageTitle()" />
        </div>
        <div class="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <div class="lg:max-w-6xl lg:mx-auto lg:px-6 lg:py-4">
            <ng-content />
          </div>
        </div>

        <div class="lg:hidden">
          <app-bottom-nav [activePage]="activePage()" />
        </div>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  pageTitle = input<string>('Dashboard');
  activePage = input<string>('main');
}
