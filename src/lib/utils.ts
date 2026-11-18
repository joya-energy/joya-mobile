import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge aware of the Joya theme extensions, otherwise custom font
 * sizes (`text-kpi`) are mistaken for colours and dropped next to `text-navy`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['page-title', 'section-title', 'card-title', 'caption', 'kpi', 'kpi-lg'] },
      ],
      shadow: [{ shadow: ['joya-xs', 'joya-sm', 'joya-md', 'joya-lg', 'joya-coral', 'joya-ring'] }],
      rounded: [{ rounded: ['pill', 'xs'] }],
      'font-family': [{ font: ['display', 'data'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
