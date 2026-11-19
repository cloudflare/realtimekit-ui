```jsx live
<RtkParticipantsPreview meeting={meeting} />
```

You can change how many avatars are shown in the stack, and how often the
list is refreshed. The caption always counts everyone, for example
"John, Jane and 25 others in the meeting".

```jsx live
<RtkParticipantsPreview meeting={meeting} maxAvatars={3} pollInterval={15000} />
```
