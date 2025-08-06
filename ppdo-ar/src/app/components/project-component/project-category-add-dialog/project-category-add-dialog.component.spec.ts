import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCategoryAddDialogComponent } from './project-category-add-dialog.component';

describe('ProjectCategoryAddDialogComponent', () => {
  let component: ProjectCategoryAddDialogComponent;
  let fixture: ComponentFixture<ProjectCategoryAddDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCategoryAddDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCategoryAddDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
