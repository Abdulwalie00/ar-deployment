import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PGO, Event as EventModel} from '../../../models/event.model';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-event-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgOptimizedImage
  ],
  template: `
    <div class="space-y-4">
      <button
        (click)="cancel.emit()"
        class="flex items-center text-blue-500 hover:text-blue-700 mb-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clip-rule="evenodd"/>
        </svg>
        Back to list
      </button>

      <h3 class="text-xl font-bold">{{ isEditMode ? 'Edit Event' : 'Add New Event' }}</h3>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Title*</label>
            <input
              type="text"
              [(ngModel)]="eventData.title"
              name="title"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Division*</label>
            <select
              [(ngModel)]="eventData.division"
              name="division"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option *ngFor="let division of divisions" [value]="division">
                {{ division }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Description*</label>
          <textarea
            [(ngModel)]="eventData.description"
            name="description"
            required
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Status and Location -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Status*</label>
            <select
              [(ngModel)]="eventData.status"
              name="status"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option *ngFor="let status of statusOptions" [value]="status">
                {{ status }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Location*</label>
            <input
              type="text"
              [(ngModel)]="eventData.location"
              name="location"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
          </div>
        </div>

        <!-- Completion Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Completion Date</label>
          <input
            type="date"
            [(ngModel)]="eventData.dateCompletion"
            name="dateCompletion"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
          <p class="mt-1 text-sm text-gray-500">Required for Completed events</p>
        </div>

        <!-- Budget -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Budget</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              [(ngModel)]="eventData.budget"
              name="budget"
              min="0"
              step="0.01"
              class="block w-full pl-7 pr-12 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
          </div>
        </div>

        <!-- Fund Source and Images -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Fund Source*</label>
          <input
            type="text"
            [(ngModel)]="eventData.fundSource"
            name="fundSource"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
        </div>

        <input type="file" (change)="onFileChange($event)" multiple accept="image/*"/>

        <div class="grid grid-cols-3 gap-2 mt-4" *ngIf="newEvent.images.length > 0">
          <img
            *ngFor="let image of newEvent.images"
            ngSrc="{{image}}"
            class="cursor-pointer h-24 w-full object-cover rounded"
            alt="Uploaded event image"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-2 pt-4 border-t">
          <button
            type="button"
            (click)="cancel.emit()"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {{ isEditMode ? 'Update Event' : 'Save Event' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class EventFormComponent {
  @Input() isEditMode = false;
  @Input() eventData: Omit<EventModel, 'id' | 'images' | 'dateCompletion'> & {
    images: string;
    dateCompletion?: string;
  } = {
    title: '',
    description: '',
    location: '',
    dateCompletion: undefined,
    budget: undefined,
    fundSource: '',
    images: '',
    division: 'PTCAO',
    status: 'Planned'
  };
  @Input() divisions: PGO[] = [];
  @Input() statusOptions: EventModel['status'][] | undefined;
  @Output() submitEvent = new EventEmitter<{
    eventData: Omit<EventModel, 'id'>;
    isEditMode: boolean;
  }>();
  @Output() cancel = new EventEmitter<void>();

  newEvent = {
    title: '',
    description: '',
    location: '',
    division: '',
    status: '',
    dateCompletion: null,
    budget: null,
    fundSource: '',
    images: [] as string[]
  };

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    for (const file of Array.from(input.files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.newEvent.images.push(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit() {
    const images = this.eventData.images ?
      this.eventData.images.split(',').map(url => url.trim()).filter(url => url) : [];

    const eventToEmit = {
      ...this.eventData,
      images,
      dateCompletion: this.eventData.dateCompletion ? new Date(this.eventData.dateCompletion) : undefined
    };

    this.submitEvent.emit({
      eventData: eventToEmit,
      isEditMode: this.isEditMode
    });
  }


}
