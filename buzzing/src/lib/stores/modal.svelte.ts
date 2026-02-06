import type { Component, Snippet } from 'svelte';

interface ModalProps {
    title: string;
    message: string | Snippet;
    confirmCallback?: () => void;
    cancelCallback?: () => void;
    confirmText?: string;
    cancelText?: string;
    disabled?: boolean;
    size?: "small" | "large";
}

interface ComponentState {
    component: Component<any>;
    props: Record<string, any>;
}

let currentState = $state<ModalProps | ComponentState | null>(null);

export const modalStore = {
    get current() {
        return currentState;
    },
    show(props: ModalProps) {
        currentState = props;
    },
    showComponent<T extends Record<string, unknown>>(component: Component<T>, props: T) {
        currentState = { component, props };
    },
    hide() {
        currentState = null;
    },
};
