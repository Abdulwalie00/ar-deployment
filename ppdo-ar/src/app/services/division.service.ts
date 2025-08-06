import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Division } from '../models/project.model';
import { environment } from '../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class DivisionService {
  // Cache to store divisions to avoid repeated HTTP calls
  private divisionsCache$: Observable<Division[]> | null = null;
  private divisions: Division[] = [];

  constructor(private http: HttpClient) { }

  getDivisions(): Observable<Division[]> {
    // Use cache if available
    if (this.divisionsCache$) {
      return this.divisionsCache$;
    }
    // Fetch from API, cache the result, and then return it
    this.divisionsCache$ = this.http.get<Division[]>(`${environment.apiUrl}divisions`).pipe(
      tap(divisions => this.divisions = divisions) // Store the divisions locally
    );
    return this.divisionsCache$;
  }

  /**
   * Gets a single division by its unique code.
   * This method fetches all divisions and filters them on the client-side.
   * @param code The division code to search for.
   * @returns An Observable of the found Division or null.
   */
  getDivisionByCode(code: string): Observable<Division | null> {
    // Check local data first
    const foundDivision = this.divisions.find(d => d.code === code);
    if (foundDivision) {
      return of(foundDivision); // Return from local data if found
    }
    // If not found in local data, fetch all and then find it
    return this.getDivisions().pipe(
      map(divisions => divisions.find(d => d.code === code) || null)
    );
  }

  getDivisionById(id: string): Observable<Division> {
    return this.http.get<Division>(`${environment.apiUrl}divisions/${id}`);
  }

  createDivision(division: Omit<Division, 'id' | 'dateCreated' | 'dateUpdated'>): Observable<Division> {
    return this.http.post<Division>(`${environment.apiUrl}divisions`, division).pipe(
      // Invalidate cache on create
      tap(() => this.divisionsCache$ = null)
    );
  }

  updateDivision(id: string, updatedData: Partial<Division>): Observable<Division> {
    return this.http.put<Division>(`${environment.apiUrl}divisions/${id}`, updatedData).pipe(
      // Invalidate cache on update
      tap(() => this.divisionsCache$ = null)
    );
  }

  deleteDivision(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}divisions/${id}`).pipe(
      // Invalidate cache on delete
      tap(() => this.divisionsCache$ = null)
    );
  }
}
