Template

```html
<rtk-camera-toggle #one>
  <rtk-menu-item slot="additional-menu-items">Video effects</rtk-menu-item>
</rtk-camera-toggle>
<rtk-camera-toggle #two></rtk-camera-toggle>
<rtk-camera-toggle #three></rtk-camera-toggle>
<rtk-camera-toggle #four></rtk-camera-toggle>
```

Component

```js
class MyComponent {
  title = 'MyComponent';

  @ViewChild('one') componentOne: RtkCameraToggle;

  @ViewChild('two') componentTwo: RtkCameraToggle;

  @ViewChild('three') componentThree: RtkCameraToggle;

  @ViewChild('four') componentFour: RtkCameraToggle;

  rtkMeeting: RealtimeKitClient; // meeting instance

  async ngAfterViewInit() {
    // Change the size to small
    this.componentOne.meeting = this.rtkMeeting;
    this.componentOne.size = 'sm';

    // Change the size to large
    this.componentTwo.meeting = this.rtkMeeting;
    this.componentTwo.size = 'lg';

    // Render as a horizontal button
    this.componentThree.meeting = this.rtkMeeting;
    this.componentThree.variant = 'horizontal';

    // Hide the device menu in a custom layout
    this.componentFour.meeting = this.rtkMeeting;
    this.componentFour.hideDeviceSelectionMenu = true;
  }
}
```
