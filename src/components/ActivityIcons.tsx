import React from 'react';
import {
  Moon,
  CloudMoon,
  Droplets,
  RefreshCw,
  Heart,
  UtensilsCrossed,
  ClipboardList,
  CircleAlert,
  Trash2,
} from 'lucide-react-native';
import { BottleIcon } from './BottleIcon';
import type { DiaperType, FeedingType } from '../types';

type IconProps = {
  size?: number;
  color: string;
};

export function FeedingTypeIcon({
  type,
  size = 18,
  color,
}: IconProps & { type: FeedingType }) {
  switch (type) {
    case 'breast':
      return <Heart size={size} color={color} />;
    case 'bottle':
      return <BottleIcon size={size} color={color} />;
    case 'solid':
      return <UtensilsCrossed size={size} color={color} />;
  }
}

export function DiaperTypeIcon({
  type,
  size = 18,
  color,
}: IconProps & { type: DiaperType }) {
  switch (type) {
    case 'wet':
      return <Droplets size={size} color={color} />;
    case 'dirty':
      return <CircleAlert size={size} color={color} />;
    case 'both':
      return <RefreshCw size={size} color={color} />;
  }
}

export function SleepTypeIcon({
  type,
  size = 18,
  color,
}: IconProps & { type: 'night' | 'nap' }) {
  return type === 'night' ? (
    <Moon size={size} color={color} />
  ) : (
    <CloudMoon size={size} color={color} />
  );
}

export function ActivityEntryIcon({
  item,
  size = 18,
  color,
}: IconProps & {
  item: {
    start?: string;
    type?: string;
  };
}) {
  if (item.start) {
    return item.type === 'night' ? (
      <Moon size={size} color={color} />
    ) : (
      <CloudMoon size={size} color={color} />
    );
  }
  if (item.type === 'wet' || item.type === 'dirty' || item.type === 'both') {
    return <DiaperTypeIcon type={item.type as DiaperType} size={size} color={color} />;
  }
  if (item.type === 'breast' || item.type === 'bottle' || item.type === 'solid') {
    return <FeedingTypeIcon type={item.type as FeedingType} size={size} color={color} />;
  }
  return <ClipboardList size={size} color={color} />;
}

export function DeleteIcon({ size = 20, color }: IconProps) {
  return <Trash2 size={size} color={color} />;
}
