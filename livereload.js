new EventSource('/events').addEventListener('change', (e) => {
    console.log(e)
    location.reload()
});
