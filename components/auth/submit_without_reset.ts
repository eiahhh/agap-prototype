import { startTransition, type FormEvent } from "react";

// React 19 resets a <form action={...}> after every submission, which unticks checkboxes even
// while their React state still says "checked". Submitting manually skips that reset.
// Keep `action` on the form as well, so it still works before JavaScript loads.
export function submit_without_reset(form_action: (form_data: FormData) => void) {
    return (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form_data = new FormData(event.currentTarget);
        startTransition(() => form_action(form_data));
    };
}
