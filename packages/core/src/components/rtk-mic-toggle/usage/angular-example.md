Template

```html
<rtk-mic-toggle #one>
  <rtk-menu-item slot="additional-menu-items">Audio settings</rtk-menu-item>
</rtk-mic-toggle>
<rtk-mic-toggle #two></rtk-mic-toggle>
<rtk-mic-toggle #three></rtk-mic-toggle>
<rtk-mic-toggle #four></rtk-mic-toggle>
```

Component

```js
class MyComponent {
  title = 'MyComponent';

  @ViewChild('one') componentOne: RtkMicToggle;

  @ViewChild('two') componentTwo: RtkMicToggle;

  @ViewChild('three') componentThree: RtkMicToggle;

  @ViewChild('four') componentFour: RtkMicToggle;

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
