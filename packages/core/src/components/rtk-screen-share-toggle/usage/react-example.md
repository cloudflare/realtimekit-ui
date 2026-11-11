```jsx live
<Center>
  <RtkScreenShareToggle size="sm" meeting={meeting} />
  <RtkScreenShareToggle size="lg" meeting={meeting} />
  <RtkScreenShareToggle variant="horizontal" size="sm" meeting={meeting} />
</Center>
```

### Customize the active-sharing trigger

Override `screenshare.menu` and `share_screen_menu` without changing the label
or icon of the actual stop actions:

The `share_screen_different` key independently controls the "Share Different
Screen" icon in both the menu and self-share view.

```jsx
import { defaultIconPack, useLanguage } from '@cloudflare/realtimekit-ui';
import { RtkScreenShareToggle } from '@cloudflare/realtimekit-react-ui';

const t = useLanguage({ 'screenshare.menu': 'Sharing Options' });
const iconPack = {
  ...defaultIconPack,
  share_screen_menu: defaultIconPack.horizontal_dots,
};

<RtkScreenShareToggle meeting={meeting} t={t} iconPack={iconPack} />;
```
