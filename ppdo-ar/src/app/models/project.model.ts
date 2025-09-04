// src/app/models/project.model.ts
import { User } from './user.model';

export interface Division {
  id: string;
  name: string;
  code: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface ProjectImage {
  id: string;
  projectId: string;
  imageUrl: string; // For local images, this will be a Data URL or Blob URL
  caption?: string;
  dateUploaded: Date;
}

export interface ProjectCategory {
  id: string;
  name: string;
  code: string;
  division: Division;
}

export interface ProjectCategoryDto {
  name: string;
  code: string;
}

export interface Comment {
  id: string;
  content: string;
  dateCreated: Date;
  user: User;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  dateCreated: Date;
  dateUpdated: Date;
  implementationSchedule: Date;
  dateOfAccomplishment: Date;
  budget: number;
  percentCompletion: number;
  targetParticipant?: string;
  fundSource: string;
  division: Division;
  officeInCharge: string;
  remarks: string;
  objectives: string;
  projectCategory?: ProjectCategory;
  images: ProjectImage[];
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  aipYear?: number;
  typeOfProject?: string;
  isNew?: boolean;
  narrativeReport?: string;
}
