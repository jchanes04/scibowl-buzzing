let url = $state<string | null>(null);
let window = $state<Window | null>(null);

export default {
    get value() {
        return { url, window };
    },
    set value(newValue: { url: string | null, window: Window | null }) {
        url = newValue.url;
        window = newValue.window;
    }
}