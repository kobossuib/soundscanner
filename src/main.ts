import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from "@angular/common/http";
import { ActivatedRoute } from '@angular/router';



bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
})
  .catch((err) => console.error(err));

