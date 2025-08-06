// app/components/project-component/project-dashboard/project-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
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
  imports: [CommonModule, RouterModule],
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.css']
})
export class ProjectDashboardComponent implements OnInit {
  projects: Project[] = [];
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

  constructor(
    private projectDataService: ProjectDataService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const isAdmin = this.authService.isAdmin();
    const isSuperAdmin = this.authService.isSuperAdmin();

    if (isSuperAdmin || isAdmin) {
      this.projectDataService.getProjects().subscribe(allProjects => {
        this.projects = allProjects;
        this.calculateStatusCounts();
        this.groupProjectsByDivision();
      });
    } else {
      this.userService.getCurrentUserDivision().pipe(
        switchMap(userDivision => {
          if (!userDivision) {
            return of([]);
          }
          this.userDivisionCode = userDivision.code;
          if (userDivision.code) {
            if (userDivision.code === 'ICTO') {
              this.divisionLogoUrl = 'app/assets/logos/ICTO.png';
            } else {
              this.divisionLogoUrl = `app/assets/logos/${userDivision.code}.png`;
            }
          }
          return this.projectDataService.getProjects(this.userDivisionCode);
        })
      ).subscribe(filteredProjects => {
        this.projects = filteredProjects;
        this.calculateStatusCounts();
        this.groupProjectsByDivision();
      });
    }
  }

  private calculateStatusCounts(): void {
    this.statusCounts = {
      planned: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      total: this.projects.length
    };

    this.projects.forEach(project => {
      const status = project.status as ProjectStatusKey;
      if (this.statusCounts.hasOwnProperty(status)) {
        this.statusCounts[status]++;
      }
    });
  }

  private groupProjectsByDivision(): void {
    this.projectsByDivision = {};

    this.projects.forEach(project => {
      const divisionName = project.division.name;
      if (!this.projectsByDivision[divisionName]) {
        this.projectsByDivision[divisionName] = [];
      }
      this.projectsByDivision[divisionName].push(project);
    });

    // Sort projects within each division by dateCreated in descending order
    for (const divisionName of Object.keys(this.projectsByDivision)) {
      this.projectsByDivision[divisionName].sort((a, b) => {
        const dateA = new Date(a.dateCreated).getTime();
        const dateB = new Date(b.dateCreated).getTime();
        return dateB - dateA; // Sort in descending order (latest date first)
      });
    }
  }

  get divisionNames(): string[] {
    return Object.keys(this.projectsByDivision).sort();
  }
}
