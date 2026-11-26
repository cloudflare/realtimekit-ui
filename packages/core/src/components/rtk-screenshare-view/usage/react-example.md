```jsx live
<RtkScreenshareView
  meeting={meeting}
  participant={meeting.self}
  style={{ height: '480px' }}
>
  <RtkNameTag participant={meeting.self}>
    <RtkAudioVisualizer slot="start" participant={meeting.self} />
  </RtkNameTag>
</RtkScreenshareView>
```

When `meeting.self` shares a screen, a red border means no joined participant is viewing.
A green border means everyone is viewing.
If some participants are viewing, the view shows the others as avatars.
The status is hidden when no one else has joined.
Set `maxVisibleViewerAvatars` to change how many avatars appear before `+N` (3 by default).
