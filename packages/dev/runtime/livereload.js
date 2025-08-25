const events = new EventSource('/events');
events.addEventListener('change', () => {
    console.log('change')
    location.reload();
});

// reload on server restart
let isStarted = false;
events.addEventListener('open', () => {
    if (isStarted) location.reload();
    isStarted = true;
});
