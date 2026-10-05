// app/components/project-component/project-list/project-list.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, Subject, combineLatest, forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Project } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

type ProjectStatus = Project['status'];
type SortOption = 'newest' | 'title' | 'progress-desc' | 'progress-asc' | 'start-date';

const VIEW_MODE_STORAGE_KEY = 'project-view-mode';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DatePipe],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit, OnDestroy, OnChanges {
  @Input() inputProjects: Project[] | null = null;
  @Input() showAddButton: boolean = true;
  @Input() currentDivisionCode: string | null = null;
  @Input() viewMode: 'list' | 'grid' = 'grid';

  allProjects: Project[] = [];
  filteredProjects: Project[] = [];
  currentFilterStatus: string | null = null;
  currentYear: string | null = null;
  currentViewMode: 'list' | 'grid' = 'grid';
  searchTerm = '';
  sortBy: SortOption = 'newest';
  isLoading = true;
  loadError = false;

  readonly statusOptions: ProjectStatus[] = ['planned', 'ongoing', 'completed', 'cancelled'];
  readonly sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest first' },
    { value: 'title', label: 'Title (A–Z)' },
    { value: 'start-date', label: 'Start date' },
    { value: 'progress-desc', label: 'Most progress' },
    { value: 'progress-asc', label: 'Least progress' }
  ];

  private destroy$ = new Subject<void>();
  private reload$ = new BehaviorSubject<number>(0);
  private newProjectIds: Set<string> = new Set();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectDataService: ProjectDataService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  /** True when this is the /project-list page rather than embedded in a division page. */
  get isStandalone(): boolean {
    return this.inputProjects === null;
  }

  get hasActiveFilters(): boolean {
    return !!this.currentFilterStatus || this.searchTerm.trim().length > 0;
  }

  ngOnInit(): void {
    this.currentViewMode = this.readSavedViewMode() ?? this.viewMode;
    const isUserAdmin = this.authService.isAdmin() || this.authService.isSuperAdmin();

    combineLatest([this.route.paramMap, this.route.queryParamMap, this.reload$]).pipe(
      // Status is filtered on the client so switching it is instant and the
      // per-status counts stay accurate.
      tap(([, queryParams]) => {
        this.currentFilterStatus = queryParams.get('status');
        this.applyFilter();
      }),
      map(([params, queryParams, reload]) => ({
        division: params.get('divisionCode') || queryParams.get('division'),
        year: queryParams.get('year') || null,
        reload
      })),
      distinctUntilChanged((a, b) => a.division === b.division && a.year === b.year && a.reload === b.reload),
      tap(({ year }) => {
        this.currentYear = year;
        this.isLoading = true;
        this.loadError = false;
      }),
      switchMap(({ division, year }) => this.fetchProjects(isUserAdmin, division, year)),
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.isLoading = false;
      if (!result) {
        this.loadError = true;
        return;
      }

      this.newProjectIds = new Set(result.newProjects.map(p => p.id));
      this.allProjects = result.projects.map(p => ({ ...p, isNew: this.newProjectIds.has(p.id) }));
      this.applyFilter();
    });
  }

  private fetchProjects(isUserAdmin: boolean, division: string | null, year: string | null):
    Observable<{ projects: Project[]; newProjects: Project[] } | null> {
    // Regular users may only ever see their own division's projects.
    const projects$ = isUserAdmin
      ? this.projectDataService.getProjects(division ?? undefined, undefined, year ?? undefined)
      : this.userService.getCurrentUserDivision().pipe(
        switchMap(userDivision => {
          this.currentDivisionCode = userDivision?.code || null;
          return this.currentDivisionCode
            ? this.projectDataService.getProjects(this.currentDivisionCode, undefined, year ?? undefined)
            : of([]);
        })
      );

    return forkJoin({
      projects: projects$,
      // The "New" badge is a nice-to-have; never fail the page over it.
      newProjects: this.projectDataService.getNewProjects().pipe(catchError(() => of([] as Project[])))
    }).pipe(catchError(() => of(null)));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputProjects'] && this.inputProjects) {
      // Re-apply the new status if the input projects change
      this.allProjects = this.inputProjects.map(p => ({
        ...p,
        isNew: this.newProjectIds.has(p.id)
      }));
      this.applyFilter();
    }
    if (changes['viewMode'] && !changes['viewMode'].firstChange) {
      this.currentViewMode = this.viewMode;
    }
  }

  retry(): void {
    this.reload$.next(this.reload$.value + 1);
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const matches = this.allProjects.filter(project => {
      if (this.currentFilterStatus && project.status !== this.currentFilterStatus) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [
        project.title,
        project.location,
        project.division?.name,
        project.division?.code,
        project.projectCategory?.name,
        project.fundSource
      ].some(value => (value ?? '').toLowerCase().includes(term));
    });

    this.filteredProjects = this.sortProjects(matches);
  }

  countByStatus(status: string | null): number {
    return status
      ? this.allProjects.filter(project => project.status === status).length
      : this.allProjects.length;
  }

  setStatusFilter(status: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.setStatusFilter(null);
    this.applyFilter();
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'planned': return 'Planned';
      case 'ongoing': return 'Ongoing';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown Status';
    }
  }

  goToAddProject(): void {
    if (this.currentDivisionCode) {
      this.router.navigate(['/project-add'], { queryParams: { division: this.currentDivisionCode } });
    } else {
      this.router.navigate(['/project-add']);
    }
  }

  viewProjectDetails(projectId: string): void {
    this.router.navigate(['/project-detail', projectId]);
  }

  resetFilter(): void {
    this.setStatusFilter(null);
  }

  goBack(): void {
    this.router.navigate(['/project-dashboard']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleView(): void {
    this.currentViewMode = this.currentViewMode === 'grid' ? 'list' : 'grid';
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, this.currentViewMode);
    } catch {
      // Remembering the view is a convenience only.
    }
  }

  private readSavedViewMode(): 'list' | 'grid' | null {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      return saved === 'list' || saved === 'grid' ? saved : null;
    } catch {
      return null;
    }
  }

  private sortProjects(projects: Project[]): Project[] {
    const time = (value: Date | string) => new Date(value).getTime() || 0;
    return [...projects].sort((a, b) => {
      switch (this.sortBy) {
        case 'title': return a.title.localeCompare(b.title);
        case 'start-date': return time(a.startDate) - time(b.startDate);
        case 'progress-desc': return (b.percentCompletion ?? 0) - (a.percentCompletion ?? 0);
        case 'progress-asc': return (a.percentCompletion ?? 0) - (b.percentCompletion ?? 0);
        default: return time(b.dateCreated) - time(a.dateCreated);
      }
    });
  }
}
