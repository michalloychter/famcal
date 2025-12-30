import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DailyCalendar } from './daily-calendar';

describe('DailyCalender', () => {
  let component: DailyCalendar;
  let fixture: ComponentFixture<DailyCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DailyCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
