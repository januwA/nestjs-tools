import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DtoComponent } from './dto/dto.component';
import { SchemaComponent } from './schema/schema.component';
import { HomeComponent } from './home/home.component';
import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor';

const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: 'assets',
  defaultOptions: { scrollBeyondLastLine: false },
  onMonacoLoad: () => {
    const monaco = (window as any).monaco;
    const ts = monaco.languages.typescript;

    const CompilerOptions = ts.typescriptDefaults.getCompilerOptions();
    ts.typescriptDefaults.setCompilerOptions({
      ...CompilerOptions,
      experimentalDecorators: true,
      target: 'es2015',
      module: 'es2020',
    });

    const json = monaco.languages.json;
    json.jsonDefaults.setDiagnosticsOptions({
      validate: false,
    });
  },
};

@NgModule({
  declarations: [AppComponent, DtoComponent, SchemaComponent, HomeComponent],
  imports: [
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MonacoEditorModule.forRoot(monacoConfig),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
