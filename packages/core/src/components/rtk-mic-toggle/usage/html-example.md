```html
<rtk-mic-toggle size="sm" class="rtk-el">
  <rtk-menu-item slot="additional-menu-items">Audio settings</rtk-menu-item>
</rtk-mic-toggle>
<rtk-mic-toggle size="lg" class="rtk-el"></rtk-mic-toggle>
<rtk-mic-toggle variant="horizontal" class="rtk-el"></rtk-mic-toggle>
<rtk-mic-toggle id="rtk-mic-no-menu" class="rtk-el"></rtk-mic-toggle>

<script>
  document.getElementById('rtk-mic-no-menu').hideDeviceSelectionMenu = true;

  const elements = document.getElementsByClassName('rtk-el');
  for (const el of elements) {
    el.meeting = meeting;
  }
</script>
```
