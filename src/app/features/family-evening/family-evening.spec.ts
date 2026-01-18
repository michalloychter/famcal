import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FamilyEveningComponent } from './family-evening';

describe('FamilyEveningComponent', () => {
  let component: FamilyEveningComponent;
  let fixture: ComponentFixture<FamilyEveningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyEveningComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FamilyEveningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the form and title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Family Evening Planner');
    expect(compiled.querySelector('form')).toBeTruthy();
  });
});
