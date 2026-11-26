```html
<rtk-screenshare-view class="rtk-el" style="height: 480px">
  <rtk-name-tag class="rtk-el">
    <rtk-audio-visualizer class="rtk-el" slot="start"></rtk-audio-visualizer>
  </rtk-name-tag>
</rtk-screenshare-view>

<script>
  const elements = document.getElementsByClassName('rtk-el');
  for (const el of elements) {
    el.participant = meeting.self;
  }
  document.querySelector('rtk-screenshare-view').meeting = meeting;
</script>
```

When `meeting.self` shares a screen, a red border means no joined participant is viewing.
A green border means everyone is viewing.
If some participants are viewing, the view shows the others as avatars.
The status is hidden when no one else has joined.
Set `maxVisibleViewerAvatars` to change how many avatars appear before `+N` (3 by default).
