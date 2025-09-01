// app/components/project-component/project-list/project-list.component.ts
import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, ParamMap } from '@angular/router'; // Add ParamMap here
import {of, Subject, switchMap, tap} from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Project } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
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
  currentViewMode: 'list' | 'grid' = 'grid';
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projectDataService: ProjectDataService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentViewMode = this.viewMode;
    const isUserAdmin = this.authService.isAdmin() || this.authService.isSuperAdmin();

    this.route.paramMap.pipe(
      switchMap((paramMap: ParamMap) => {
        let divisionCodeFromRoute = paramMap.get('divisionCode');

        return this.route.queryParamMap.pipe(
          switchMap(queryParams => {
            this.currentFilterStatus = queryParams.get('status');
            const divisionCodeFromQuery = queryParams.get('division');
            const year = queryParams.get('year');

            const finalDivisionCode = divisionCodeFromRoute || divisionCodeFromQuery;

            // Force user to only view their own division's projects
            if (!isUserAdmin) {
              return this.userService.getCurrentUserDivision().pipe(
                switchMap(userDivision => {
                  this.currentDivisionCode = userDivision?.code || null;
                  if (this.currentDivisionCode) {
                    return this.projectDataService.getProjects(this.currentDivisionCode, this.currentFilterStatus ?? undefined, year ?? undefined);
                  }
                  return of([]);
                })
              );
            }

            // Admins and Super Admins can see all, using either path or query param
            return this.projectDataService.getProjects(finalDivisionCode ?? undefined, this.currentFilterStatus ?? undefined, year ?? undefined);
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(projects => {
      this.allProjects = this.sortProjects(projects);
      this.filteredProjects = this.allProjects;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputProjects'] && this.inputProjects) {
      this.allProjects = this.sortProjects(this.inputProjects);
      this.applyFilter();
    }
    if (changes['viewMode']) {
      this.currentViewMode = this.viewMode;
    }
  }

  applyFilter(): void {
    if (this.currentFilterStatus) {
      this.filteredProjects = this.allProjects.filter(project =>
        project.status === this.currentFilterStatus
      );
    } else {
      this.filteredProjects = this.allProjects;
    }
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
    const division = this.route.snapshot.queryParamMap.get('division');
    const year = this.route.snapshot.queryParamMap.get('year');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: null, division: division, year: year },
      queryParamsHandling: 'merge'
    });
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
  }

  private sortProjects(projects: Project[]): Project[] {
    return [...projects].sort((a, b) => {
      const dateA = new Date(a.dateCreated).getTime();
      const dateB = new Date(b.dateCreated).getTime();
      return dateB - dateA;
    });
  }
}
