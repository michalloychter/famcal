import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header} from './layout/header/header'; // Import HeaderComponent
import { Footer } from './layout/footer/footer';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
})

export class App {
  protected readonly title = signal('famcal');
}
