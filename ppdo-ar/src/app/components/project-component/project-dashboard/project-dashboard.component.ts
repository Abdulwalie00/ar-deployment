// app/components/project-component/project-dashboard/project-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Project } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

interface ProjectStatusCounts {
  planned: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  total: number;
}

type ProjectStatusKey = keyof Omit<ProjectStatusCounts, 'total'>;

@Component({
  selector: 'app-project-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Add FormsModule
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css']
})
export class ProjectDashboardComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = []; // Holds the projects for the selected year
  statusCounts: ProjectStatusCounts = {
    planned: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    total: 0
  };
  projectsByDivision: { [divisionName: string]: Project[] } = {};
  readonly statusList: ProjectStatusKey[] = ['planned', 'ongoing', 'completed', 'cancelled'];
  userDivisionCode: string | null = null;
  divisionLogoUrl: string | null = null;
  ldsLogoUrl: string = 'app/assets/logos/LDS.png';

  // Properties for the year filter
  years: number[] = [];
  selectedYear: number | string = ''; // Can be number or string from select

  constructor(
    private projectDataService: ProjectDataService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const isAdmin = this.authService.isAdmin();
    const isSuperAdmin = this.authService.isSuperAdmin();

    const projectsObservable = (isSuperAdmin || isAdmin)
      ? this.projectDataService.getProjects()
      : this.userService.getCurrentUserDivision().pipe(
        switchMap(userDivision => {
          if (!userDivision) {
            return of([]);
          }
          this.userDivisionCode = userDivision.code;
          if (userDivision.code) {
            this.divisionLogoUrl = `app/assets/logos/${userDivision.code}.png`;
          }
          return this.projectDataService.getProjects(this.userDivisionCode);
        })
      );

    projectsObservable.subscribe(allProjects => {
      this.projects = allProjects;
      this.populateYears();
      this.applyFilters(); // Apply initial filter
    });
  }

  private populateYears(): void {
    const projectYears = this.projects.map(p => new Date(p.startDate).getFullYear());
    this.years = [...new Set(projectYears)].sort((a, b) => b - a);
    if (this.years.length > 0) {
      this.selectedYear = this.years[0]; // Default to the most recent year
    }
  }

  // This function is called whenever the year selection changes
  onYearChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    const yearToFilter = Number(this.selectedYear);

    if (yearToFilter) {
      this.filteredProjects = this.projects.filter(p => new Date(p.startDate).getFullYear() === yearToFilter);
    } else {
      this.filteredProjects = [...this.projects];
    }

    // Recalculate everything based on the newly filtered projects
    this.calculateStatusCounts();
    this.groupProjectsByDivision();
  }

  private calculateStatusCounts(): void {
    // Reset counts before recalculating
    this.statusCounts = {
      planned: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      total: this.filteredProjects.length
    };

    // Use the filtered list for calculations
    this.filteredProjects.forEach(project => {
      const status = project.status as ProjectStatusKey;
      if (this.statusCounts.hasOwnProperty(status)) {
        this.statusCounts[status]++;
      }
    });
  }

  private groupProjectsByDivision(): void {
    this.projectsByDivision = {};

    // Use the filtered list for grouping
    this.filteredProjects.forEach(project => {
      const divisionName = project.division.name;
      if (!this.projectsByDivision[divisionName]) {
        this.projectsByDivision[divisionName] = [];
      }
      this.projectsByDivision[divisionName].push(project);
    });

    for (const divisionName of Object.keys(this.projectsByDivision)) {
      this.projectsByDivision[divisionName].sort((a, b) => {
        const dateA = new Date(a.dateCreated).getTime();
        const dateB = new Date(b.dateCreated).getTime();
        return dateB - dateA;
      });
    }
  }

  get divisionNames(): string[] {
    return Object.keys(this.projectsByDivision).sort();
  }
}
