import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HouseTasksTableComponent } from './house-tasks-table.component';
import { By } from '@angular/platform-browser';

describe('HouseTasksTableComponent', () => {
  let component: HouseTasksTableComponent;
  let fixture: ComponentFixture<HouseTasksTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseTasksTableComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HouseTasksTableComponent);
    component = fixture.componentInstance;
    component.days = ['Sunday', 'Monday'];
    component.tasksMap = {
      'Alice': {
        'Sunday': { title: 'Dishes', details: '', color: '#ffd54f', familyId: 'test', memberName: 'Alice', day: 'Sunday' },
        'Monday': { title: 'Laundry', details: '', color: '#4fc3f7', familyId: 'test', memberName: 'Alice', day: 'Monday' }
      },
      'Bob': {
        'Sunday': { title: 'Trash', details: '', color: '#aed581', familyId: 'test', memberName: 'Bob', day: 'Sunday' },
        'Monday': { title: '', details: '', color: '#ff8a65', familyId: 'test', memberName: 'Bob', day: 'Monday' }
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the correct number of rows and columns', () => {
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2); // 2 members
    const cells = rows[0].queryAll(By.css('td'));
    expect(cells.length).toBe(3); // 1 member + 2 days
  });

  it('should display the correct task for each member and day', () => {
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows[0].nativeElement.textContent).toContain('Dishes');
    expect(rows[0].nativeElement.textContent).toContain('Laundry');
    expect(rows[1].nativeElement.textContent).toContain('Trash');
  });
});
