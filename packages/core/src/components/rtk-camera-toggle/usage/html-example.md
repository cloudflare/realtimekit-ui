```html
<rtk-camera-toggle size="sm" class="rtk-el">
  <rtk-menu-item slot="additional-menu-items">Video effects</rtk-menu-item>
</rtk-camera-toggle>
<rtk-camera-toggle size="lg" class="rtk-el"></rtk-camera-toggle>
<rtk-camera-toggle variant="horizontal" class="rtk-el"></rtk-camera-toggle>
<rtk-camera-toggle id="rtk-camera-no-menu" class="rtk-el"></rtk-camera-toggle>

<script>
  document.getElementById('rtk-camera-no-menu').hideDeviceSelectionMenu = true;

  const elements = document.getElementsByClassName('rtk-el');
  for (const el of elements) {
    el.meeting = meeting;
  }
</script>
```
