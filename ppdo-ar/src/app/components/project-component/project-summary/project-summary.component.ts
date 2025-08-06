import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Division, Project } from '../../../models/project.model';
import { ProjectDataService } from '../../../services/project-data.service';
import { DivisionService } from '../../../services/division.service';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-project-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './project-summary.component.html',
})
export class ProjectSummaryComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  paginatedProjects: Project[] = [];

  // Filter options
  divisions: Division[] = [];
  statuses: string[] = ['planned', 'ongoing', 'completed', 'cancelled'];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = [];

  // Selected filter values
  selectedStatus: string = '';
  selectedDivision: string = '';
  selectedMonth: string = '';
  selectedYear: string = '';

  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  itemsPerPageOptions: number[] = [10, 20, 50, 100];
  totalPages: number = 0;

  // User role and division
  isAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  userDivisionName: string = ''; // To store division name for print header
  userDivisionCode: string = ''; // To store division code for the logo
  private authSubscription: Subscription | undefined;

  constructor(
    private projectDataService: ProjectDataService,
    private divisionService: DivisionService,
    public authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isSuperAdmin = this.authService.isSuperAdmin();

    if (this.isSuperAdmin || this.isAdmin) {
      this.loadDivisions();
      this.loadProjectsForAdmin();
    } else {
      const username = this.authService.getUsername();
      if (username) {
        this.userService.getUserByUsername(username).subscribe(user => {
          if (user?.division) {
            this.userDivisionName = user.division.name; // Store division name
            this.userDivisionCode = user.division.code; // Store division code
            this.loadProjectsForDivision(user.division.id);
          }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  loadProjectsForAdmin(): void {
    this.projectDataService.getProjects().subscribe(allProjects => {
      this.projects = allProjects;
      this.filterProjects(); // Apply initial filter (which shows all)
      this.populateYears();
    });
  }

  loadProjectsForDivision(divisionId: string | undefined): void {
    if (!divisionId) {
      this.projects = [];
      this.filterProjects();
      return;
    }
    this.projectDataService.getProjects().subscribe(allProjects => {
      this.projects = allProjects.filter(p => p.division.id === divisionId);
      this.filterProjects();
      this.populateYears();
    });
  }

  loadDivisions(): void {
    this.divisionService.getDivisions().subscribe(data => {
      this.divisions = data;
    });
  }

  populateYears(): void {
    if (this.projects.length > 0) {
      const projectYears = this.projects.map(p => new Date(p.startDate).getFullYear());
      // Use Set to get unique years and then sort them
      this.years = [...new Set(projectYears)].sort((a, b) => b - a); // Sort descending
    } else {
      this.years = [];
    }
  }

  filterProjects(): void {
    let tempProjects = [...this.projects]; // Start with a fresh copy of all relevant projects

    // Apply Status Filter
    if (this.selectedStatus) {
      tempProjects = tempProjects.filter(p => p.status === this.selectedStatus);
    }

    // Apply Year Filter
    if (this.selectedYear) {
      tempProjects = tempProjects.filter(p => new Date(p.startDate).getFullYear() === parseInt(this.selectedYear, 10));
    }

    // Apply Division Filter (only for Admins)
    if (this.isAdmin && this.selectedDivision) {
      tempProjects = tempProjects.filter(p => p.division.id === this.selectedDivision);
    }

    // Apply Month Filter
    if (this.selectedMonth) {
      const monthIndex = this.months.indexOf(this.selectedMonth);
      if (monthIndex !== -1) {
        tempProjects = tempProjects.filter(p => new Date(p.startDate).getMonth() === monthIndex);
      }
    }

    this.filteredProjects = tempProjects;
    this.currentPage = 1; // Reset to first page after filtering
    this.updatePagination();
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedDivision = '';
    this.selectedMonth = '';
    this.selectedYear = '';
    this.filterProjects(); // Re-run filter to show all projects
  }

  updatePagination(): void {
    if (this.filteredProjects.length > 0) {
      this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
      const startIndex = (this.currentPage - 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      this.paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);
    } else {
      this.totalPages = 0;
      this.paginatedProjects = [];
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  private safePrintValue(value: any): string {
    return value !== null && value !== undefined ? value.toString() : '';
  }

  printReport(): void {
    const month = this.selectedMonth || 'All Months';
    const year = this.selectedYear || 'All Years';
    let divisionName = 'All Divisions';
    let divisionLogoUrl = '';

    if (this.isAdmin) {
      if (this.selectedDivision) {
        const division = this.divisions.find(d => d.id === this.selectedDivision);
        divisionName = division ? division.name : 'All Divisions';
        if (division) {
          divisionLogoUrl = `app/assets/logos/${division.code}.png`;
        }
      }
    } else {
      divisionName = this.userDivisionName || 'N/A';
      if (this.userDivisionCode) {
        divisionLogoUrl = `app/assets/logos/${this.userDivisionCode}.png`;
      }
    }

    const projectsByCategory: { [key: string]: Project[] } = {};

    this.filteredProjects.forEach(project => {
      const categoryName = project.projectCategory?.name || 'Uncategorized';
      if (!projectsByCategory[categoryName]) {
        projectsByCategory[categoryName] = [];
      }
      projectsByCategory[categoryName].push(project);
    });

    let projectRows = '';
    for (const categoryName in projectsByCategory) {
      if (Object.prototype.hasOwnProperty.call(projectsByCategory, categoryName)) {
        projectRows += `
          <tr class="category-row">
            <td colspan="12"><strong>${this.safePrintValue(categoryName)}</strong></td>
          </tr>
        `;
        projectsByCategory[categoryName].forEach(project => {
          const startDate = new Date(project.startDate).toLocaleDateString();

          projectRows += `
                <tr class="main-row">
                  <td>${this.safePrintValue(project.title)}</td>
                  <td>${this.safePrintValue(project.location)}</td>
                  <td>${this.safePrintValue(project.targetParticipant)}</td>
                  <td>${this.safePrintValue(project.implementationSchedule)}</td>
                  <td>${this.safePrintValue(startDate)}</td>
                  <td>${this.safePrintValue(project.dateOfAccomplishment)}</td>
                  <td>${this.safePrintValue(project.officeInCharge)}</td>
                  <td>${this.safePrintValue(project.budget)}</td>
                  <td>${this.safePrintValue(project.fundSource)}</td>
                  <td>${this.safePrintValue(project.percentCompletion)}${'%'}</td>
                  <td>${this.safePrintValue(project.budget)}</td>
                  <td>${this.safePrintValue(project.remarks)}</td>
                </tr>
            `;
        });
      }
    }

    if (this.filteredProjects.length === 0) {
      projectRows = '<tr><td colspan="12" style="text-align: center;">No data available for the selected filters.</td></tr>';
    }

    const printHtml = `
      <html>
      <head>
        <title>Project Summary Report</title>
        <style>
          @media print {
            @page { size: landscape; }
            body { font-family: Arial, sans-serif; font-size: 10pt; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .header-table td { vertical-align: middle; padding: 5px; border: 0 }
            .logo {
              width: 100%;
              height: auto;
              max-height: 120px; /* Adjust max-height as needed */
              object-fit: contain;
            }
            .header-text { text-align: center; }
            .header-text p { margin: 0; line-height: 1.4; }
            .report-title { font-size: 14pt; font-weight: bold; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background-color: #e0e0e0; font-weight: bold; }
            .main-row { border-top: 2px solid #000; }
            tbody tr:first-child.main-row { border-top: none; }
            .category-row td { background-color: rgba(255,219,139,0.78); font-style: italic; padding-left: 20px; border-bottom: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 15%; text-align: center;">
              <img src="app/assets/logos/LDS.png" alt="Lanao del Sur Logo" class="logo">
            </td>
            <td class="header-text">
              <p>Republic of the Philippines</p>
              <p>BANGSAMORO AUTONOMOUS REGION IN MUSLIM MINDANAO</p>
              <p>PROVINCE OF LANAO DEL SUR</p>
              <p>New Capitol Complex, Buadi Sacayo, Marawi City</p>
              <p class="report-title">MONTHLY ACCOMPLISHMENT REPORT</p>
              <p>Month of: ${month}, ${year}</p>
              <p>Office: ${divisionName}</p>
            </td>
            <td style="width: 15%; text-align: center;">
              ${divisionLogoUrl ? `<img src="${divisionLogoUrl}" alt="Division Logo" class="logo">` : ''}
            </td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Location</th>
              <th>Target Participants</th>
              <th>Implementation Schedule</th>
              <th>Start Date</th>
              <th>Date Accomplished</th>
              <th>Person/s and or Office in Charge</th>
              <th>Target Budget (Php)</th>
              <th>Source of Fund</th>
              <th>% of Completion</th>
              <th>Total Cost Incurred to Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${projectRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500); // Timeout to ensure content loads
    }
  }
}
