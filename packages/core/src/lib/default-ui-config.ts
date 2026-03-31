import { UIConfig } from '../types/ui-config';
import clone from '../utils/clone';

/**
 * The default UI Config
 */
export const defaultConfig: UIConfig = {
  designTokens: {
    spacingBase: 4,
    googleFont: 'Inter',
  },
  styles: {
    // 'rtk-meeting': {
    // NOTE(vaibhavshn): required for mobile devices with static positioning
    // not required for fixed position
    // height: '-webkit-fill-available',
    // },
    'rtk-header': {
      display: 'grid',
      height: '48px',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: '1fr',
      alignItems: 'center',
      '--header-section-gap': 'var(--rtk-space-2, 8px)',
    },
    'rtk-header.sm': {
      display: 'grid',
      gridArea: 'header',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: '1fr',
      alignItems: 'center',
      '--header-section-gap': 'var(--rtk-space-1, 4px)',
    },
    'div#header-left': {
      display: 'flex',
      alignItems: 'center',
      height: '48px',
      wordBreak: 'break-all',
      gap: 'var(--header-section-gap)',
    },
    'rtk-logo': {
      height: '26px',
    },
    'div#header-center': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      wordBreak: 'break-all',
      gap: 'var(--header-section-gap)',
      paddingInline: 'var(--rtk-space-3, 12px)',
    },
    'div#header-right': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 'var(--header-section-gap)',
    },
    'rtk-stage': {
      display: 'flex',
      flex: '1',
    },
    'rtk-grid': {
      flex: '1',
      height: 'auto',
    },
    'rtk-controlbar': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gridTemplateRows: '1fr',
      alignItems: 'center',
      padding: '8px',
    },
    'rtk-controlbar.sm': {
      display: 'flex',
      position: 'relative',
      backgroundColor: 'rgb(var(--rtk-colors-background-1000, 0 0 0))',
    },
    'rtk-controlbar.md': {
      display: 'flex',
      position: 'relative',
      backgroundColor: 'rgb(var(--rtk-colors-background-1000, 0 0 0))',
    },
    'div#controlbar-left': {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--rtk-space-1, 4px)',
    },
    'div#controlbar-center': {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--rtk-space-1, 4px)',
      position: 'relative',
      overflow: 'visible',
      justifyContent: 'center',
    },
    'div#controlbar-mobile': {
      display: 'flex',
      flex: '1',
      alignItems: 'center',
      gap: 'var(--rtk-space-1, 4px)',
      justifyContent: 'center',
    },
    'div#controlbar-right': {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--rtk-space-1, 4px)',
      justifyContent: 'flex-end',
    },
    'rtk-settings': {
      width: '720px',
      height: '480px',
    },
    'rtk-debugger': {
      width: '720px',
      height: '480px',
    },
    'rtk-breakout-rooms-manager': {
      minHeight: '400px',
      minWidth: '500px',
      maxWidth: '80%',
      maxHeight: '480px',
    },
    'div#setupcontrols-media': {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      display: 'flex',
      gap: '4px',
    },
    'div#setupcontrols-settings': {
      position: 'absolute',
      top: '8px',
      right: '8px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    },
    'rtk-meeting-title.sm': {
      marginLeft: '0',
    },
    'rtk-clock': {
      marginRight: '0',
    },
  },
  root: {
    'rtk-meeting': {
      // if using key value pair, provide the key in `state`
      // else provide array of states in `states`
      state: 'meeting',
      states: ['activeSidebar'],
    },
    'rtk-meeting[meeting=waiting]': ['rtk-waiting-screen'],
    'rtk-meeting[meeting=idle]': ['rtk-idle-screen'],
    'rtk-meeting[meeting=setup]': ['rtk-setup-screen', 'rtk-dialog-manager'],
    'rtk-meeting[meeting=joined]': [
      'rtk-header',
      'rtk-stage',
      'rtk-controlbar',
      'rtk-participants-audio',
      'rtk-dialog-manager',
    ],
    'rtk-meeting[meeting=joined].activeSidebar.sm': {
      add: [['rtk-sidebar', { view: 'full-screen' }]],
    },
    'rtk-meeting[meeting=joined].activeSidebar.md': {
      add: [['rtk-sidebar', { view: 'full-screen' }]],
    },
    'rtk-meeting[meeting=ended]': ['rtk-ended-screen'],

    'rtk-header': ['div#header-left', 'div#header-center', 'div#header-right'],
    'rtk-header.sm': { remove: ['div#header-center'] },

    'div#header-left': ['rtk-logo', 'rtk-recording-indicator', 'rtk-livestream-indicator'],
    'div#header-center': ['rtk-meeting-title'],
    'div#header-right': [
      'rtk-grid-pagination',
      'rtk-clock',
      'rtk-participant-count',
      'rtk-viewer-count',
    ],

    'div#header-left.sm': [
      'rtk-meeting-title',
      'rtk-recording-indicator',
      'rtk-livestream-indicator',
    ],

    'rtk-stage': {
      states: ['activeSidebar'],
      children: ['rtk-grid', 'rtk-notifications', 'rtk-transcripts'],
    },

    'rtk-stage.activeSidebar': {
      add: [['rtk-sidebar', { view: 'sidebar' }]],
    },

    // hide sidebar for smaller screens
    'rtk-stage.activeSidebar.sm': { remove: ['rtk-sidebar'] },

    'rtk-grid': {
      states: ['activeScreenShare', 'activePlugin', 'activeSpotlight'],
      children: ['rtk-simple-grid'],
    },

    'rtk-grid.activeSpotlight': ['rtk-spotlight-grid'],

    'rtk-grid.activeScreenShare': ['rtk-mixed-grid'],
    'rtk-grid.activePlugin': ['rtk-mixed-grid'],

    'rtk-grid.activeScreenShare.activeSpotlight': ['rtk-mixed-grid'],
    'rtk-grid.activePlugin.activeSpotlight': ['rtk-mixed-grid'],
    'rtk-grid.activePlugin.activeScreenShare.activeSpotlight': ['rtk-mixed-grid'],

    'rtk-mixed-grid': {
      states: ['activeSpotlight'],
      children: ['rtk-simple-grid'],
    },

    'rtk-mixed-grid.activeSpotlight': ['rtk-spotlight-grid'],

    'rtk-participant-tile': {
      state: 'meeting',
      children: ['rtk-name-tag', 'rtk-avatar', 'rtk-network-indicator'],
    },

    'rtk-participant-setup': ['rtk-avatar', 'div#setupcontrols-media'],
    'rtk-participant-tile[meeting=setup]': [
      'rtk-avatar',
      'div#setupcontrols-settings',
      'div#setupcontrols-media',
    ],

    'div#setupcontrols-media': [
      ['rtk-mic-toggle', { size: 'sm' }],
      ['rtk-camera-toggle', { size: 'sm' }],
    ],
    'div#setupcontrols-settings': [['rtk-settings-toggle', { size: 'sm' }]],
    'rtk-screenshare-view': {
      children: ['rtk-name-tag', 'rtk-network-indicator'],
    },

    'rtk-name-tag': [['rtk-audio-visualizer', { slot: 'start' }]],

    'rtk-controlbar': {
      states: ['activeMoreMenu'],
      props: {
        variant: 'solid',
      },
      children: ['div#controlbar-left', 'div#controlbar-center', 'div#controlbar-right'],
    },

    'rtk-more-toggle': {
      states: ['activeMoreMenu'],
      children: [],
    },

    'rtk-controlbar.sm': ['div#controlbar-mobile'],
    'rtk-controlbar.md': ['div#controlbar-mobile'],

    'rtk-more-toggle.activeMoreMenu': [
      ['rtk-fullscreen-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-pip-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-caption-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-mute-all-button', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-breakout-rooms-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-recording-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-debugger-toggle', { variant: 'horizontal' }],
    ],

    'rtk-more-toggle.activeMoreMenu.sm': [
      ['rtk-chat-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-participants-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-polls-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-plugins-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-fullscreen-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-screen-share-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-pip-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-caption-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-mute-all-button', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-breakout-rooms-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-settings-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-ai-toggle', { variant: 'horizontal' }],
      ['rtk-debugger-toggle', { variant: 'horizontal' }],
    ],
    'rtk-more-toggle.activeMoreMenu.md': [
      ['rtk-chat-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-participants-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-polls-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-plugins-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-fullscreen-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-screen-share-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-pip-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-caption-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-mute-all-button', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-breakout-rooms-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-settings-toggle', { variant: 'horizontal', slot: 'more-elements' }],
      ['rtk-ai-toggle', { variant: 'horizontal' }],
      ['rtk-debugger-toggle', { variant: 'horizontal' }],
    ],

    'div#controlbar-mobile': [
      'rtk-mic-toggle',
      'rtk-camera-toggle',
      'rtk-webinar-stage-toggle',
      'rtk-stage-toggle',
      'rtk-leave-button',
      'rtk-more-toggle',
    ],
    'div#controlbar-left': [
      'rtk-settings-toggle',
      'rtk-screen-share-toggle',
      'rtk-livestream-toggle',
    ],
    'div#controlbar-center': [
      'rtk-mic-toggle',
      'rtk-camera-toggle',
      'rtk-webinar-stage-toggle',
      'rtk-stage-toggle',
      'rtk-more-toggle',
      'rtk-leave-button',
    ],
    'div#controlbar-right': [
      'rtk-chat-toggle',
      'rtk-polls-toggle',
      'rtk-participants-toggle',
      'rtk-plugins-toggle',
      'rtk-ai-toggle',
    ],
  },
  config: {
    notification_sounds: {
      participant_left: false,
    },
    participant_joined_sound_notification_limit: 10,
    participant_chat_message_sound_notification_limit: 10,
    videoFit: 'cover',
  },
};

export const createDefaultConfig = (): UIConfig => {
  return clone(defaultConfig);
};
