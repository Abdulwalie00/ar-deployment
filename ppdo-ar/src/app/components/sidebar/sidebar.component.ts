
import {Component, ElementRef, OnDestroy, OnInit, Renderer2, effect, signal, untracked} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {NavigationEnd, Router, RouterModule} from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHome,
  faChevronRight,
  faChevronDown,
  faUsers,
  faCircle,
  faCaretRight,
  faCaretLeft,
  faCaretDown,
  faBuildingColumns, faLineChart, faSeedling, faPeopleGroup, faBridgeWater,
  faBell, faFolderOpen, faFileLines, faMagnifyingGlass, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Observable, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import {AuthService} from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { LayoutService } from '../../services/layout.service';

const COLLAPSED_STORAGE_KEY = 'sidebar-collapsed';

interface MenuItem {
  title: string;
  icon: any;
  link?: string;
  isExpanded?: boolean;
  children?: MenuItem[];
  requiredRole?: string;
  tooltip?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
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
  isCollapsed = signal(this.readCollapsedPreference());
  currentMenuTopPosition: number = 1;
  officeQuery = '';
  userDivisionCode: string | null = null;
  private globalClickUnlistener: (() => void) | undefined = undefined;
  private routerSubscription?: Subscription;

  faHome = faHome;
  faBell = faBell;
  faFolderOpen = faFolderOpen;
  faFileLines = faFileLines;
  faMagnifyingGlass = faMagnifyingGlass;
  faXmark = faXmark;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef,
    private authService: AuthService,
    private userService: UserService,
    public layout: LayoutService
  ) {
    this.isAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPERADMIN'))
    );
    this.isSuperAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_SUPERADMIN'))
    );
    this.collapseSubmenuOnNavigate();

    // The mobile drawer always shows full labels.
    effect(() => {
      if (this.layout.mobileNavOpen() && untracked(this.isCollapsed)) {
        this.isCollapsed.set(false);
        this.expandActiveGroup();
      }
    });
  }

  menuItems = signal<MenuItem[]>([
    {
      title: 'Dashboard',
      icon: faHome,
      link: '/project-dashboard',
    },
    {
      title: 'SEPARATOR',
      icon: null
    },
    {
      title: 'Social',
      icon: faPeopleGroup,
      isExpanded: false,
      children: [
        {title: 'RYDO', icon: faCircle ,link: '/project-division/RYDO', tooltip: 'Ranao Youth and Development Office'},
        { title: 'GAD', icon: faCircle, link: '/project-division/GAD', tooltip: 'Gender and Development' },
        { title: 'PSWDO', icon: faCircle, link: '/project-division/PSWDO', tooltip: 'Provincial Social Welfare and Development Office' },
        { title: 'PHO', icon: faCircle, link: '/project-division/PHO', tooltip: 'Provincial Health Office' },
        { title: 'PYSDO', icon: faCircle, link: '/project-division/PYSDO', tooltip: 'Provincial Youth, Sports and Development Office' },
        { title: 'PCPC', icon: faCircle, link: '/project-division/PCPC', tooltip: 'Provincial Council for the Protection of Children' },
        { title: 'PCAT', icon: faCircle, link: '/project-division/PCAT', tooltip: 'Provincial Council Against Trafficking' },
      ]
    },
    {
      title: 'Institutional',
      icon: faBuildingColumns,
      isExpanded: false,
      children: [
        { title: 'PDO', icon: faCircle, link: '/project-division/PDO', tooltip: 'Provincial Development Office' },
        { title: 'PPDO', icon: faCircle, link: '/project-division/PPDO', tooltip: 'Provincial Planning and Development Office' },
        { title: 'PSF', icon: faCircle, link: '/project-division/PSF', tooltip: 'Public Safety Force' },
        { title: 'PASSO', icon: faCircle, link: '/project-division/PASSO', tooltip: 'Provincial Assessor\'s Office' },
        { title: 'LPPPL', icon: faCircle, link: '/project-division/LPPPL', tooltip: 'Lanao del Sur People\'s Provincial Library' },
        { title: 'PIO', icon: faCircle, link: '/project-division/PIO', tooltip: 'Public Information Office' },
        { title: 'PGO', icon: faCircle, link: '/project-division/PGO', tooltip: 'Provincial Governor\'s Office' },
        { title: 'PWO', icon: faCircle, link: '/project-division/PWO', tooltip: 'Provincial Warden\'s Office' },
        { title: 'PHRMO', icon: faCircle, link: '/project-division/PHRMO', tooltip: 'Provincial Human Resource Management Office' },
        { title: 'SP', icon: faCircle, link: '/project-division/SP', tooltip: 'Sangguniang Panlalawigan' },
        { title: 'PGSO', icon: faCircle, link: '/project-division/PGSO', tooltip: 'Provincial General Services Office' },
        { title: 'PBO', icon: faCircle, link: '/project-division/PBO', tooltip: 'Provincial Budget Office' },
        { title: 'PACCO', icon: faCircle, link: '/project-division/PACCO', tooltip: 'Provincial Accountant\'s Office' },
        { title: 'PTO', icon: faCircle, link: '/project-division/PTO', tooltip: 'Provincial Treasurer\'s Office' },
        { title: 'PLO', icon: faCircle, link: '/project-division/PLO', tooltip: 'Provincial Legal Office' },
        { title: 'IAS', icon: faCircle, link: '/project-division/IAS', tooltip: 'Internal Audit Service' },
        { title: 'PADO', icon: faCircle, link: '/project-division/PADO', tooltip: 'Provincial Administrator\'s office '},
      ]
    },
    {
      title: 'Economic',
      icon: faLineChart,
      isExpanded: false,
      children: [
        { title: 'PCO', icon: faCircle, link: '/project-division/PCO', tooltip: 'Provincial Cooperative Office' },
        { title: 'PTLDC', icon: faCircle, link: '/project-division/PTLDC', tooltip: 'Provincial Tourism, Livelihood, and Development Center' },
        { title: 'OPAG', icon: faCircle, link: '/project-division/OPAG', tooltip: 'Office of the Provincial Agriculturist' },
        { title: 'PVO', icon: faCircle, link: '/project-division/PVO', tooltip: 'Provincial Veterinary Office' },
        { title: 'PTCAO', icon: faCircle, link: '/project-division/PTCAO', tooltip: 'Provincial Tourism and Cultural Affairs Office' },
      ]
    },
    {
      title: 'Environment',
      icon: faSeedling,
      isExpanded: false,
      children: [
        { title: 'PDRRMO', icon: faCircle, link: '/project-division/PDRRMO', tooltip: 'Provincial Disaster Risk Reduction and Management Office' },
        { title: 'PENRO', icon: faCircle, link: '/project-division/PENRO', tooltip: 'Provincial Environment and Natural Resources Office' },
      ]
    },
    {
      title: 'Infrastructure',
      icon: faBridgeWater,
      isExpanded: false,
      children: [
        { title: 'PEO', icon: faCircle, link: '/project-division/PEO', tooltip: 'Provincial Engineer\'s Office' },
        { title: 'ARCHITECT', icon: faCircle, link: '/project-division/PAO', tooltip: 'Provincial Architect\'s Office' },
        { title: 'ICTO', icon: faCircle, link: '/project-division/ICTO', tooltip: 'Information and Communication Technology Office' },
      ]
    },
    {
      title: 'Account Management',
      icon: faUsers,
      link: '/accounts',
      requiredRole: 'ROLE_SUPERADMIN'
    }
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

    this.expandActiveGroup();

    // Regular users only see their own office, so link straight to it.
    if (!this.authService.isAdmin() && !this.authService.isSuperAdmin()) {
      this.userService.getCurrentUserDivision().subscribe({
        next: division => this.userDivisionCode = division?.code ?? null,
        error: () => this.userDivisionCode = null
      });
    }
  }

  ngOnDestroy() {
    if (this.globalClickUnlistener) {
      this.globalClickUnlistener();
    }
    this.routerSubscription?.unsubscribe();
  }

  /** Children of a sector that match the office search (all when empty). */
  visibleChildren(item: MenuItem): MenuItem[] {
    const query = this.officeQuery.trim().toLowerCase();
    if (!query || !item.children) {
      return item.children ?? [];
    }
    return item.children.filter(child =>
      child.title.toLowerCase().includes(query) ||
      (child.tooltip ?? '').toLowerCase().includes(query)
    );
  }

  get isSearching(): boolean {
    return this.officeQuery.trim().length > 0;
  }

  get hasSearchResults(): boolean {
    return this.menuItems().some(item => item.children && this.visibleChildren(item).length > 0);
  }

  clearOfficeSearch(): void {
    this.officeQuery = '';
  }

  isGroupActive(item: MenuItem): boolean {
    return !!item.children?.some(child => child.link && this.router.url.startsWith(child.link));
  }

  /** Opens the sector that contains the current page so users see where they are. */
  private expandActiveGroup(): void {
    if (this.isCollapsed()) {
      return;
    }
    const activeGroup = this.menuItems().find(item => this.isGroupActive(item));
    if (activeGroup && !activeGroup.isExpanded) {
      this.menuItems().forEach(item => item.isExpanded = item === activeGroup);
    }
  }

  private readCollapsedPreference(): boolean {
    try {
      return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  toggleMenu(clickedItem: MenuItem) {
    if (clickedItem.children) {
      const wasExpanded = clickedItem.isExpanded;

      // First, collapse all other submenus
      this.menuItems().forEach(item => {
        if (item !== clickedItem && item.children) {
          item.isExpanded = false;
        }
      });

      // Then, toggle the state of the clicked item
      clickedItem.isExpanded = !wasExpanded;
    }
  }

  handleMenuClick(menuItem: MenuItem, event: MouseEvent) {
    if (this.isCollapsed()) {
      // This logic already ensures only one is open at a time for the collapsed state
      const currentlyExpanded = menuItem.isExpanded;
      this.menuItems().forEach(item => {
        if (item !== menuItem) { // Close all *other* pop-ups
          item.isExpanded = false;
        }
      });
      menuItem.isExpanded = !currentlyExpanded; // Then toggle the clicked one

      if (menuItem.isExpanded) {
        this.calculateTopPosition(event);
      }
      event.stopPropagation();
    } else {
      // For the expanded sidebar, use the updated toggleMenu logic
      this.toggleMenu(menuItem);
    }
  }


  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(this.isCollapsed()));
    } catch {
      // Preference is a convenience only.
    }

    if (this.isCollapsed()) {
      this.menuItems().forEach(menu => {
        menu.isExpanded = false;
      });
    } else {
      this.expandActiveGroup();
    }
  }

  collapseSubmenuOnNavigate() {
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.layout.closeMobileNav();
        if (this.isCollapsed()) {
          this.menuItems().forEach(menu => {
            menu.isExpanded = false;
          });
        } else {
          this.expandActiveGroup();
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
