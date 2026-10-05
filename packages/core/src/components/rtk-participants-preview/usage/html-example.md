```html
<rtk-participants-preview id="rtk-el"></rtk-participants-preview>

<script>
  const el = document.getElementById('rtk-el');
  el.meeting = meeting;
</script>
```

You can change how many avatars are shown in the stack, and how often the
list is refreshed. The caption always counts everyone, for example
"John, Jane and 25 others in the meeting".

```html
<rtk-participants-preview
  id="rtk-el"
  max-avatars="3"
  poll-interval="15000"
></rtk-participants-preview>

<script>
  const el = document.getElementById('rtk-el');
  el.meeting = meeting;
</script>
```

Avatars are rendered through the UI config, so you can customise them
with `config.root['rtk-avatar']` and `config.styles['rtk-avatar']`.

```html
<rtk-participants-preview id="rtk-el"></rtk-participants-preview>

<script>
  const el = document.getElementById('rtk-el');
  el.meeting = meeting;
  el.config = {
    ...el.config,
    root: {
      ...el.config.root,
      'rtk-avatar': { props: { variant: 'hexagon' } },
    },
  };
</script>
```
