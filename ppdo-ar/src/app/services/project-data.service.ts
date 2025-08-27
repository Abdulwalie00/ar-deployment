// src/app/services/project-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, Division, ProjectCategory, ProjectCategoryDto, Comment } from '../models/project.model'; // Import Comment
import { environment } from '../environment/environment';


@Injectable({
  providedIn: 'root'
})
export class ProjectDataService {

  constructor(private http: HttpClient) { }

  // --- Project Methods ---

  getProjects(divisionCode?: string, status?: string, year?: string): Observable<Project[]> {
    let params = new HttpParams();
    if (divisionCode) {
      params = params.set('divisionCode', divisionCode);
    }
    if (status) {
      params = params.set('status', status);
    }
    if (year) {
      params = params.set('year', year);
    }
    return this.http.get<Project[]>(`${environment.apiUrl}projects`, { params });
  }

  getProjectById(id: string): Observable<Project> {
    return this.http.get<Project>(`${environment.apiUrl}projects/${id}`);
  }

  addProject(projectData: Omit<Project, 'id' | 'dateCreated' | 'dateUpdated' | 'division' | 'comments'> & { divisionId: string }): Observable<Project> {
    return this.http.post<Project>(`${environment.apiUrl}projects`, projectData);
  }

  updateProject(id: string, projectData: Partial<Omit<Project, 'id' | 'dateCreated' | 'dateUpdated' | 'division' | 'comments'> & { divisionId: string }>): Observable<Project> {
    return this.http.put<Project>(`${environment.apiUrl}projects/${id}`, projectData);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}projects/${id}`);
  }

  // --- Division Methods ---

  getDivisions(): Observable<Division[]> {
    return this.http.get<Division[]>(`${environment.apiUrl}divisions`);
  }

  // --- Project Category Methods ---

  getProjectCategories(divisionId?: string): Observable<ProjectCategory[]> {
    let params = new HttpParams();
    if (divisionId) {
      params = params.set('divisionId', divisionId);
    }
    return this.http.get<ProjectCategory[]>(`${environment.apiUrl}project-categories`, { params });
  }

  addProjectCategory(categoryData: ProjectCategoryDto): Observable<ProjectCategory> {
    return this.http.post<ProjectCategory>(`${environment.apiUrl}project-categories`, categoryData);
  }

  updateProjectCategory(id: string, categoryData: ProjectCategoryDto): Observable<ProjectCategory> {
    return this.http.put<ProjectCategory>(`${environment.apiUrl}project-categories/${id}`, categoryData);
  }

  deleteProjectCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}project-categories/${id}`);
  }

  getArchivedProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}projects/archived`);
  }


  // --- File Upload Method ---

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrl}files/upload`, formData, { responseType: 'text' });
  }

  // --- Comment Methods ---

  getComments(projectId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${environment.apiUrl}projects/${projectId}/comments`);
  }

  addComment(projectId: string, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${environment.apiUrl}projects/${projectId}/comments`, { content });
  }


}
