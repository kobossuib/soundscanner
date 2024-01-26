import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './servicios/api/api.service';
import { BasicComponent } from './basic/basic.component';
import { HttpClientModule, HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BasicComponent, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'soundscout';
}
