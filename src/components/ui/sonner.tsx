'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/** Joya toasts: white card, hairline border, semantic left accent. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:border-line group-[.toaster]:bg-white group-[.toaster]:font-sans group-[.toaster]:text-navy group-[.toaster]:shadow-joya-lg',
          title: 'group-[.toast]:text-sm group-[.toast]:font-semibold',
          description: 'group-[.toast]:text-[13px] group-[.toast]:text-ink-muted',
          actionButton:
            'group-[.toast]:rounded-pill group-[.toast]:bg-coral group-[.toast]:font-semibold group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:rounded-pill group-[.toast]:bg-slate-100 group-[.toast]:text-navy',
          success: 'group-[.toaster]:[&_[data-icon]]:text-success',
          error: 'group-[.toaster]:[&_[data-icon]]:text-danger',
          warning: 'group-[.toaster]:[&_[data-icon]]:text-warning',
          info: 'group-[.toaster]:[&_[data-icon]]:text-blue',
        },
      }}
      position="bottom-right"
      {...props}
    />
  );
};

export { Toaster };
