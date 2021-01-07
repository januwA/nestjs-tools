import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DtoComponent } from './dto/dto.component';
import { HomeComponent } from './home/home.component';
import { SchemaComponent } from './schema/schema.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'dto',
    component: DtoComponent,
  },
  {
    path: 'schema',
    component: SchemaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
