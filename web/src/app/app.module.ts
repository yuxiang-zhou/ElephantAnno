import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FileData } from '../providers/filedata';

import { IonRangeSliderModule } from "ng2-ion-range-slider";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonRangeSliderModule
  ],
  providers: [
    FileData
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
