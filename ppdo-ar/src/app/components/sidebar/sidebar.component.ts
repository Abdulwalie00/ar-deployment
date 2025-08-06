// app/components/sidebar/sidebar.component.ts
import {Component, ElementRef, OnDestroy, OnInit, Renderer2, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faChartBar,
  faCog,
  faChevronRight,
  faChevronDown,
  faFileAlt,
  faDatabase,
  faUsers,
  faCircle,
  faCaretRight,
  faCaretLeft,
  faCaretDown,
  faBuilding,
  faBuildingCircleArrowRight,
  faBuildingColumns, faBuildingCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {AuthService} from '../../services/auth.service';

interface MenuItem {
  title: string;
  icon: any;
  link?: string;
  isExpanded?: boolean;
  children?: MenuItem[];
  requiredRole?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  animations: [
    trigger('slideDownUp', [
      state('closed', style({ height: '0px', overflow: 'hidden', opacity: 0 })),
      state('open', style({ height: '*', overflow: 'hidden', opacity: 1 })),
      transition('closed <=> open', animate('300ms ease-in-out'))
    ]),
    trigger('sidebarSlide', [
      state('expanded', style({ width: '17rem' })),
      state('collapsed', style({ width: '3.5rem' })),
      transition('expanded <=> collapsed', animate('300ms ease-in-out')),
    ]),
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  isAdmin$: Observable<boolean>;
  isSuperAdmin$: Observable<boolean>;
  isCollapsed = signal(false);
  currentMenuTopPosition: number = 1;
  private globalClickUnlistener: (() => void) | undefined = undefined;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef,
    private authService: AuthService
  ) {
    // 👇 THIS IS THE FIX 👇
    // Now checks if the user has either ROLE_ADMIN or ROLE_SUPERADMIN
    this.isAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPERADMIN'))
    );
    // This remains the same, to specifically check for the superadmin role
    this.isSuperAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_SUPERADMIN'))
    );
    this.collapseSubmenuOnNavigate();
  }

  // ... (The rest of your component code remains the same)
  menuItems = signal<MenuItem[]>([
    {
      title: 'Dashboard',
      icon: faHome,
      link: '/project-dashboard',
    },
    {
      title: 'PGO',
      icon: faBuildingColumns,
      isExpanded: false,
      children: [
        {
          title: 'PTCAO', link: '/project-division/PTCAO',
          icon: faCircle
        },
        //PGO Pages
        { title: 'PDD', icon: faCircle, link: '/project-division/PDD' },
        { title: 'ICTO', icon: faCircle, link: '/project-division/ICTO' },
        { title: 'RYDO', icon: faCircle, link: '/project-division/RYDO' },
        { title: 'PWO', icon: faCircle, link: '/project-division/PWO' },
        { title: 'PLPP', icon: faCircle, link: '/project-division/PLPP' },
        { title: 'PTLDC', icon: faCircle, link: '/project-division/PTLDC' },
        { title: 'LEDIPO', icon: faCircle, link: '/project-division/LEDIPO' },
        { title: 'GAD', icon: faCircle, link: '/project-division/GAD' },
      ]
    },
    {
      title: 'OPVG',
      icon: faBuildingColumns,
      link: '/project-division/OPVG'
    },
    {
      title: 'Implementing',
      icon: faBuildingColumns,
      isExpanded: false,
      children: [
        { title: 'PEO', icon: faCircle, link: '/project-division/PEO' },
        { title: 'PIO', icon: faCircle, link: '/project-division/PIO' },
        { title: 'PCO', icon: faCircle, link: '/project-division/PCO' },
        { title: 'OPAG', icon: faCircle, link: '/project-division/OPAG' },
        { title: 'PENRO', icon: faCircle, link: '/project-division/PENRO' },
        { title: 'PSWDO', icon: faCircle, link: '/project-division/PSWDO' },
        { title: 'PHO', icon: faCircle, link: '/project-division/PHO' },
        { title: 'PVO', icon: faCircle, link: '/project-division/PVO' },
      ]
    },
    {
      title: 'Administrative Support',
      icon: faBuildingColumns,
      isExpanded: false,
      children: [
        { title: 'PPDO', icon: faCircle, link: '/project-division/PPDO' },
        { title: 'PHRMO', icon: faCircle, link: '/project-division/PHRMO' },
        { title: 'PGSO', icon: faCircle, link: '/project-division/PGSO' },
        { title: 'PTO', icon: faCircle, link: '/project-division/PTO' },
        { title: 'PACCO', icon: faCircle, link: '/project-division/PACCO' },
        { title: 'PBO', icon: faCircle, link: '/project-division/PBO' },
        { title: 'PLSO', icon: faCircle, link: '/project-division/PLSO' },
        { title: 'PSF', icon: faCircle, link: '/project-division/PSF' },
      ]
    },
    {
      title: 'Account Management',
      icon: faUsers,
      link: '/accounts',
      requiredRole: 'ROLE_SUPERADMIN'
    },
    {
      title: 'Settings',
      icon: faCog,
      link: '/settings'
    },
  ]);

  faChevronRight = faChevronRight;
  faChevronDown = faChevronDown;
  faCaretRight = faCaretRight;
  faCaretLeft = faCaretLeft;
  faCaretDown = faCaretDown;

  ngOnInit() {
    this.globalClickUnlistener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      this.handleClickOutside(event);
    });
  }

  ngOnDestroy() {
    if (this.globalClickUnlistener) {
      this.globalClickUnlistener();
    }
  }

  toggleMenu(menuItem: MenuItem) {
    if (menuItem.children) {
      menuItem.isExpanded = !menuItem.isExpanded;
    }
  }

  handleMenuClick(menuItem: MenuItem, event: MouseEvent) {
    if (this.isCollapsed()) {
      // Close all other submenus first
      this.menuItems().forEach(item => {
        if (item !== menuItem && item.isExpanded) {
          item.isExpanded = false;
        }
      });

      // Then toggle the clicked menu item's expansion state
      menuItem.isExpanded = !menuItem.isExpanded;

      if (menuItem.isExpanded) {
        this.calculateTopPosition(event);
      }
      event.stopPropagation();
    } else {
      this.toggleMenu(menuItem);
    }
  }


  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());

    if (this.isCollapsed()) {
      this.menuItems().forEach(menu => {
        menu.isExpanded = false;
      });
    }
  }

  collapseSubmenuOnNavigate() {
    this.router.events.subscribe(() => {
      if (this.isCollapsed()) {
        this.menuItems().forEach(menu => {
          menu.isExpanded = false;
        });
      }
    });
  }


  handleClickOutside(event: MouseEvent) {
    const clickedInside = this.el.nativeElement.contains(event.target);

    if (!clickedInside && this.isCollapsed()) {
      this.menuItems().forEach(menu => {
        menu.isExpanded = false;
      });
    }
  }

  handleSubmenuClick() {
    if (this.isCollapsed()) {
      this.menuItems().forEach(menu => {
        menu.isExpanded = false;
      });
    }
  }


  calculateTopPosition(event: MouseEvent): void {
    const clickedButton = event.currentTarget as HTMLElement;
    const buttonRect = clickedButton.getBoundingClientRect();
    this.currentMenuTopPosition = buttonRect.top - 1;
  }
}
