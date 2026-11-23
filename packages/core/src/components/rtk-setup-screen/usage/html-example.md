```html
<rtk-setup-screen id="rtk-el" style="height: 360px"></rtk-setup-screen>

<script>
  const el = document.getElementById('rtk-el');
  el.meeting = meeting;
  // Omit this override to show the media selectors by default.
  el.overrides = { hideMediaSelectorsInSetupScreen: true };
</script>
```
