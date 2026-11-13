```jsx live
<Center>
  <RtkScreenShareToggle size="sm" meeting={meeting} />
  <RtkScreenShareToggle size="lg" meeting={meeting} />
  <RtkScreenShareToggle variant="horizontal" size="sm" meeting={meeting} />
</Center>
```

### Customize the active-sharing trigger

Override `screenshare.menu` and `share_screen_menu` to customize the toggle
while sharing. These default to "Screen Sharing" and a screen-sharing icon
with a dropdown chevron.
The actual stop actions continue using `screenshare.stop` and
`share_screen_stop`.

The `share_screen_different` key independently controls the "Share Different
Screen" icon in both the menu and self-share view.

```jsx
import { defaultIconPack, useLanguage } from '@cloudflare/realtimekit-ui';
import { RtkScreenShareToggle } from '@cloudflare/realtimekit-react-ui';

const t = useLanguage({ 'screenshare.menu': 'Screen Sharing' });
const iconPack = {
  ...defaultIconPack,
  share_screen_menu: defaultIconPack.horizontal_dots,
};

<RtkScreenShareToggle meeting={meeting} t={t} iconPack={iconPack} />;
```
