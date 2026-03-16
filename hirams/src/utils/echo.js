import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,

    // ↓ Only needed for Soketi (self-hosted)
    // wsHost: '127.0.0.1',
    // wsPort: 6001,
    // forceTLS: false,
    // disableStats: true,
});

export default echo;