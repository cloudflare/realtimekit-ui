# packages/core/src/types — TypeScript Types

All shared TypeScript interfaces and types. Nothing in this directory is runtime code — types only.

## FILE MAP

| File                         | Key Types                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `props.ts`                   | `States`, `Size`, `Notification`, `UserPreferences`, `Poll`, `Chat`, `Middlewares`, `PartialStateEvent` |
| `rtk-client.ts`              | `Meeting`, `Peer`, `Self`, `Participant`, `WaitlistedParticipant`, `RemoteUpdateType`                   |
| `rtk-ai.ts`                  | `AIMessage`                                                                                             |
| `floating-ui.ts`             | `Placement` — local copy to avoid template-literal type incompatibilities with TS v3                    |
| `web-core.d.ts`              | `MediaScoreUpdateParams`, `MediaKind` — ambient only, not exported via `exports.ts`                     |
| `globals.d.ts`               | Augments `Document` + `HTMLElement` with vendor-prefixed fullscreen APIs                                |
| `ui-config/index.ts`         | `UIConfig`, `UIStyles`                                                                                  |
| `ui-config/design-tokens.ts` | `DesignTokens`, `UIColors`, `BorderWidth`, `BorderRadius`, `Theme`                                      |
| `ui-config/root.ts`          | `UIRoot`, `Element`, `ElementProps`, `StyleProps`                                                       |
| `ui-config/config.ts`        | `Config`, `NotificationConfig`, `NotificationType`, `VideoFit`, `DEFAULT_NOTIFICATION_CONFIG`           |

## KEY TYPE STRUCTURES

### `UIConfig`

```ts
interface UIConfig {
  designTokens?: DesignTokens; // visual tokens (colors, font, border, theme)
  styles?: UIStyles; // { [cssSelector]: StyleProps }
  root?: UIRoot; // component tree overrides
  config?: Config; // notification settings + videoFit
}
```

### `DesignTokens`

```ts
interface DesignTokens {
  spacingBase?: number; // base px unit (default: 4)
  fontFamily?: string;
  googleFont?: string;
  borderWidth?: 'none' | 'thin' | 'fat';
  borderRadius?: 'sharp' | 'rounded' | 'extra-rounded' | 'circular';
  colors?: UIColors;
  logo?: string;
  theme?: 'darkest' | 'dark' | 'light';
  tokenPrefix?: string; // overrides '--rtk-' prefix
}
```

### `States`

Global reactive state shared across all components. Well-known keys plus an open index signature:

```ts
interface States {
  meeting?:                    'idle' | 'setup' | 'joined' | 'ended' | 'waiting';
  viewType?:                   string;
  activeAI?:                   boolean;
  activeCaptions?:             boolean;
  activeSettings?:             boolean;
  activeDebugger?:             boolean;
  activeSidebar?:              boolean;
  activeBreakoutRoomsManager?: { active: boolean; mode?: 'create' | 'edit' | 'view'; ... };
  activeConfirmationModal?:    { header?, active, content?, onClick?, onClose?, ... };
  activeOverlayModal?:         { active, icon?, title?, description?, timeout? };
  activePermissionsMessage?:   PermissionSettings;
  prefs?:                      UserPreferences;    // { mirrorVideo?, muteNotificationSounds? }
  sidebar?:                    RtkSidebarSection;
  roomLeftState?:              RoomLeftState | 'unauthorized';
  image?:                      ImageMessage;
  [state: string]:             any;               // open-ended extension
}
```

### `UIRoot`

```ts
interface UIRoot {
  [element: string]:
    | Element[]
    | {
        state?: string; // key-value state condition: 'meeting'
        states?: string[]; // boolean state conditions: ['activeSidebar']
        props?: Record<string, any>; // static props injected at render time
        children?: Element[];
        add?: Element[];
        prepend?: Element[];
        remove?: string[];
        addBefore?: Record<string, Element[]>;
      };
}
// Element = string | [tag: string, props?: ElementProps, ...children: Element[]]
```

Selector keys use a CSS-selector-like syntax: `'rtk-meeting[meeting=joined].activeSidebar.activeAI'`. Boolean states in compound keys are sorted alphabetically.

### `Peer` and `Meeting`

These are thin aliases over the upstream SDK types, not custom interfaces:

```ts
type Meeting = RealtimeKitClient; // the SDK client object
type Peer = RTKSelf | RTKParticipant;
```

`RemoteUpdateType` is an `enum` — it requires `// eslint-disable-next-line @stencil-community/ban-exported-const-enums` if exported as `const enum`.

### `Config` (notification + video)

```ts
type Config = Partial<NotificationConfig> & { videoFit?: 'cover' | 'contain' };
// NotificationType keys: 'chat' | 'participant_joined' | 'participant_left' | 'polls' |
//   'participant_joined_waitlist' | 'webinar' | 'recording_started' | 'recording_stopped' | 'tab_sync'
```

`participant_joined_sound_notification_limit` and `participant_chat_message_sound_notification_limit` suppress audio notifications above a participant-count threshold (default: 10 each).

## ANTI-PATTERNS

- **Never** import from `web-core.d.ts` or `globals.d.ts` directly — ambient declarations only.
- **Never** use named-tuple syntax in `Element` — removed for TS v3 compatibility (see `root.ts` line 2 comment).
- **Never** add a `const enum` export without the eslint-disable comment — the `@stencil-community/ban-exported-const-enums` rule enforces this project-wide.
- **Prefer** `PartialStateEvent` over raw `States` when emitting partial state updates from components.
