import { Component } from '@angular/core';
import {HeaderComponent} from '../../header/header.component';
import {RouterOutlet} from '@angular/router';
import {SidebarComponent} from '../../sidebar/sidebar.component';
import {animate, style, transition, trigger} from '@angular/animations';

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
export class MainLayoutComponent {

}
