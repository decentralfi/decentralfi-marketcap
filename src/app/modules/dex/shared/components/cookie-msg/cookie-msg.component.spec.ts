/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CookieMsgComponent } from './cookie-msg.component';

describe('CookieMsgComponent', () => {
  let component: CookieMsgComponent;
  let fixture: ComponentFixture<CookieMsgComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CookieMsgComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CookieMsgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
