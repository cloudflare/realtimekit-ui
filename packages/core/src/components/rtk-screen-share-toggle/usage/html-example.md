```html
<rtk-screen-share-toggle size="sm" class="rtk-el"></rtk-screen-share-toggle>
<rtk-screen-share-toggle size="lg" class="rtk-el"></rtk-screen-share-toggle>
<rtk-screen-share-toggle
  variant="horizontal"
  class="rtk-el"
></rtk-screen-share-toggle>

<script>
  const elements = document.getElementsByClassName('rtk-el');
  for (const el of elements) {
    el.meeting = meeting;
  }
</script>
```

### Customize the active-sharing trigger

Override `screenshare.menu` and `share_screen_menu` to customize the toggle
while sharing. These default to "Screen Sharing" and a screen-sharing icon
with a dropdown chevron.
The actual stop actions continue using `screenshare.stop` and
`share_screen_stop`.

Override `share_screen_different` to customize the "Share Different Screen"
icon in both the menu and self-share view independently of `share_screen_start`.

```js
import { defaultIconPack, useLanguage } from '@cloudflare/realtimekit-ui';

const toggle = document.querySelector('rtk-screen-share-toggle');
toggle.t = useLanguage({ 'screenshare.menu': 'Screen Sharing' });
toggle.iconPack = {
  ...defaultIconPack,
  share_screen_menu: defaultIconPack.horizontal_dots,
};
```
