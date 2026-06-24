import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, of } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Division, Project } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { DivisionService } from '../../../services/division.service';
import { ProjectListComponent } from '../project-list/project-list.component';

@Component({
  selector: 'app-project-division-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectListComponent],
  templateUrl: './project-division-page.component.html',
  styleUrls: ['./project-division-page.component.css']
})
export class ProjectDivisionPageComponent implements OnInit, OnDestroy {
  divisionCode: string | null = null;
  division: Division | null = null;
  projects: Project[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private projectDataService: ProjectDataService,
    private divisionService: DivisionService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.isLoading = true;
        this.divisionCode = params.get('divisionCode');
        if (this.divisionCode) {
          // Fetch and assign the division object
          return this.divisionService.getDivisionByCode(this.divisionCode).pipe(
            tap(division => this.division = division), // Assign the division object
            switchMap(() => this.projectDataService.getProjects(this.divisionCode!))
          );
        } else {
          this.division = null;
          return of([]); // Return an empty array if no division code
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe(projects => {
      this.projects = projects;
      this.isLoading = false;
    });
  }

  get totalProjects(): number {
    return this.projects.length;
  }

  get completedProjects(): number {
    return this.projects.filter(project => project.status === 'completed').length;
  }

  get ongoingProjects(): number {
    return this.projects.filter(project => project.status === 'ongoing').length;
  }

  get averageCompletion(): number {
    if (this.projects.length === 0) {
      return 0;
    }

    const totalCompletion = this.projects.reduce(
      (sum, project) => sum + (project.percentCompletion ?? 0),
      0
    );

    return Math.round(totalCompletion / this.projects.length);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
