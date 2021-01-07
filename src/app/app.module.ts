import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtoComponent } from './dto/dto.component';
import { SchemaComponent } from './schema/schema.component';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [AppComponent, DtoComponent, SchemaComponent, HomeComponent],
  imports: [FormsModule, BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
