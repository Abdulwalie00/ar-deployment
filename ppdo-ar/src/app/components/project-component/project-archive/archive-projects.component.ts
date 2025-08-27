import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectDataService } from '../../../../../../../../for-dev/src/app/services/project-data.service';
import { Project } from '../../../../../../../../for-dev/src/app/models/project.model';
import { ProjectListComponent } from '../../../../../../../../for-dev/src/app/components/project-component/project-list/project-list.component';

@Component({
  selector: 'app-archive-projects',
  standalone: true,
  imports: [CommonModule, ProjectListComponent],
  template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-4 border-gray-200 dark:border-gray-700">
        Archived Projects
      </h2>
      <app-project-list [inputProjects]="archivedProjects" [showAddButton]="false"></app-project-list>
    </div>
  `,
})
export class ArchiveProjectsComponent implements OnInit {
  archivedProjects: Project[] = [];

  constructor(private projectDataService: ProjectDataService) {}

  ngOnInit(): void {
    // This assumes you have created a new backend method
    // on the ProjectDataService to fetch archived projects.
    this.projectDataService.getArchivedProjects().subscribe(projects => {
      this.archivedProjects = projects;
    });
  }
}
