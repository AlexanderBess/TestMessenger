import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const SendIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 12 20 4l-4 16-4-6-8-2Z" />
    <path d="m12 14 8-10" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BackIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export const LogoutIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const ChatBubbleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.7A8 8 0 1 1 21 12Z" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...base} width={14} height={14} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base} width={16} height={14} viewBox="0 0 20 16" {...props}>
    <path d="m2 8.5 4 4L14 4" />
  </svg>
);

export const DoubleCheckIcon = (props: IconProps) => (
  <svg {...base} width={18} height={14} viewBox="0 0 22 16" {...props}>
    <path d="m1 8.5 4 4L13 4" />
    <path d="m9 12.5 1 0L18 4" />
  </svg>
);

export const AlertIcon = (props: IconProps) => (
  <svg {...base} width={14} height={14} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </svg>
);
