import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FamilyMembers } from './family-members';

describe('FamilyMember', () => {
  let component: FamilyMembers;
  let fixture: ComponentFixture<FamilyMembers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyMembers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FamilyMembers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
