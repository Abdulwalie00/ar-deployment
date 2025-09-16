
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
  faBuildingColumns, faBuildingCircleExclamation, faLineChart, faSeedling, faPeopleGroup, faBridgeWater
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
  tooltip?: string;
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
    this.isAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPERADMIN'))
    );
    this.isSuperAdmin$ = this.authService.userRoles$.pipe(
      map(roles => roles.includes('ROLE_SUPERADMIN'))
    );
    this.collapseSubmenuOnNavigate();
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
        // { title: 'PCPC', icon: faCircle, link: '/project-division/PCPC', tooltip: 'Provincial Council for the Protection of Children' },
        // { title: 'PCAT', icon: faCircle, link: '/project-division/PCAT', tooltip: 'Provincial Council Against Trafficking' },
      ]
    },
    {
      title: 'Institutional',
      icon: faBuildingColumns,
      isExpanded: false,
      children: [
        { title: 'PDO', icon: faCircle, link: '/project-division/PDO', tooltip: 'Provincial Peace and Development Office' },
        { title: 'PPDO', icon: faCircle, link: '/project-division/PPDO', tooltip: 'Provincial Planning and Development Office' },
        { title: 'PSF', icon: faCircle, link: '/project-division/PSF', tooltip: 'Public Security Force' },
        { title: 'PASSO', icon: faCircle, link: '/project-division/PASSO', tooltip: 'Provincial Assessor\'s Office' },
        { title: 'LPPPL', icon: faCircle, link: '/project-division/LPPPL', tooltip: 'Lanao People\'s Park and Public Library' },
        { title: 'PIO', icon: faCircle, link: '/project-division/PIO', tooltip: 'Provincial Information Office' },
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
        { title: 'PTLDC', icon: faCircle, link: '/project-division/PTLDC', tooltip: 'Provincial Technology and Livelihood Development Office' },
        { title: 'OPAG', icon: faCircle, link: '/project-division/OPAG', tooltip: 'Office of the Provincial Agriculturist' },
        { title: 'PVO', icon: faCircle, link: '/project-division/PVO', tooltip: 'Provincial Veterinary Office' },
        { title: 'PTCAO', icon: faCircle, link: '/project-division/PTCAO', tooltip: 'Provincial Tourism and Cultural Affairs Division' },
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
  }

  ngOnDestroy() {
    if (this.globalClickUnlistener) {
      this.globalClickUnlistener();
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
