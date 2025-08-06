import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCategoryListComponent } from './project-category-list.component';

describe('ProjectCategoryListComponent', () => {
  let component: ProjectCategoryListComponent;
  let fixture: ComponentFixture<ProjectCategoryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCategoryListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
