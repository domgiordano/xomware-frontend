import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { AppComponent } from './app.component';
import { LandingComponent } from './components/landing/landing.component';
import { MonsterComponent } from './components/monster/monster.component';
import { CommandCenterComponent } from './components/command-center/command-center.component';
import { AuthGateComponent } from './components/command-center/auth-gate/auth-gate.component';
import { InfraDashboardComponent } from './components/command-center/infra-dashboard/infra-dashboard.component';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { SignUpComponent } from './components/auth/sign-up/sign-up.component';
import { VerifyComponent } from './components/auth/verify/verify.component';
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';
import { CallbackComponent } from './components/auth/callback/callback.component';
import { ProfileComponent } from './components/auth/profile/profile.component';

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    MonsterComponent,
    CommandCenterComponent,
    AuthGateComponent,
    InfraDashboardComponent,
    SignInComponent,
    SignUpComponent,
    VerifyComponent,
    ForgotPasswordComponent,
    CallbackComponent,
    ProfileComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
  ],
  providers: [provideHttpClient(withInterceptors([jwtInterceptor]))],
  bootstrap: [AppComponent],
})
export class AppModule {}
