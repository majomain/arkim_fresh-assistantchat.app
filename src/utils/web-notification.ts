'use client';

const ICON = '/assets/logos/arkim.webp';
const NOTIFY_KEY = 'notifications_enabled';

export function enableNotification() {
    localStorage.setItem(NOTIFY_KEY, 'true');
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            new Notification('Notifications enabled', {
                body: "You're all set to receive alerts.",
                icon: '/assets/logos/arkim.webp',
            });
        }
    });
}

export function disableNotification() {
    localStorage.setItem(NOTIFY_KEY, 'false');
}

export function notificationsEnabled() {
    return localStorage.getItem(NOTIFY_KEY) === 'true';
}

export function requestNotificationPermission() {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;

    // only request if not already granted or denied
    if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                enableNotification();
                new Notification('Notifications enabled', {
                    body: "You're all set to receive alerts.",
                    icon: '/assets/logos/arkim.webp',
                });
            }
        });
    }
}

export function webNotify(
    title: string,
    options?: NotificationOptions,
    onClick?: () => void,
) {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) return;

    if (Notification.permission !== 'granted') return;

    if (!notificationsEnabled()) return;

    if (document.visibilityState !== 'visible') {
        const notification = new Notification(title, {
            icon: ICON,
            ...options,
        });

        if (onClick) {
            notification.onclick = (event) => {
                onClick();
                notification.close(); // close the notification on click
            };
        }

        return notification;
    }
}
