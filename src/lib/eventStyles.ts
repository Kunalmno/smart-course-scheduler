import { EventType } from '../types';

export interface EventStyle {
  bg: string;
  border: string;
  text: string;
  dot: string;
  bar: string;
  badge: string;
}

/**
 * Event cards are neutral surfaces. The only hue is the type color, carried by
 * a small dot and a 2px left bar, so a dense week stays calm and the type still reads.
 */
export const eventTypeStyles: Record<EventType, EventStyle> = {
  lecture: {
    bg: 'bg-raised',
    border: 'border-line',
    text: 'text-fg',
    dot: 'bg-blue-500',
    bar: 'border-l-blue-500',
    badge: 'bg-raised text-fg-2 border-line',
  },
  lab: {
    bg: 'bg-raised',
    border: 'border-line',
    text: 'text-fg',
    dot: 'bg-emerald-500',
    bar: 'border-l-emerald-500',
    badge: 'bg-raised text-fg-2 border-line',
  },
  seminar: {
    bg: 'bg-raised',
    border: 'border-line',
    text: 'text-fg',
    dot: 'bg-cyan-500',
    bar: 'border-l-cyan-500',
    badge: 'bg-raised text-fg-2 border-line',
  },
  exam: {
    bg: 'bg-raised',
    border: 'border-line',
    text: 'text-fg',
    dot: 'bg-rose-500',
    bar: 'border-l-rose-500',
    badge: 'bg-raised text-fg-2 border-line',
  },
  maintenance: {
    bg: 'bg-raised',
    border: 'border-line',
    text: 'text-fg',
    dot: 'bg-amber-500',
    bar: 'border-l-amber-500',
    badge: 'bg-raised text-fg-2 border-line',
  },
};
