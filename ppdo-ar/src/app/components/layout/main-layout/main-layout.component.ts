import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import {HeaderComponent} from '../../header/header.component';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {SidebarComponent} from '../../sidebar/sidebar.component';
import {animate, style, transition, trigger} from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [
    HeaderComponent,
    RouterOutlet,
    SidebarComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class MainLayoutComponent implements OnDestroy {
  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLElement>;
  private navSubscription: Subscription;

  constructor(router: Router) {
    // Page content scrolls inside <main>, so the router's own scroll reset
    // does not reach it. Start every new page at the top.
    this.navSubscription = router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.scrollArea?.nativeElement.scrollTo({ top: 0 }));
  }

  ngOnDestroy(): void {
    this.navSubscription.unsubscribe();
  }
}
