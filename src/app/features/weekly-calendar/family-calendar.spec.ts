import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FamilyCalendar } from './family-calendar';

describe('FamilyCalendar', () => {
  let component: FamilyCalendar;
  let fixture: ComponentFixture<FamilyCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FamilyCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
