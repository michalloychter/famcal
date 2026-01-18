import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-required-error-message',
  standalone: true,
  template: `<span class="required-error-message">{{ fieldName }} is required.</span>`
})
export class RequiredErrorMessageComponent {
  @Input() fieldName = 'This field';
}
