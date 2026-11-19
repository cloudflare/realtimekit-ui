import { APP_INITIALIZER, NgModule } from '@angular/core';
import { DIRECTIVES } from './stencil-generated';
import { defineCustomElements } from '@cloudflare/realtimekit-ui/loader';
import { setUiKitSdkName } from '@cloudflare/realtimekit-ui';

@NgModule({
  declarations: [...DIRECTIVES],
  exports: [...DIRECTIVES],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: () => defineCustomElements,
      multi: true,
    },
  ],
})
export class RealtimeKitComponentsModule {
  constructor() {
    setUiKitSdkName('angular');
  }
}
