import { IconAirConditioning, IconBath, IconBulb, IconGrid4x4, IconPaint, IconPipeline, IconTrowel, IconWallpaper, type TablerIcon } from '@tabler/icons-react';

export type CategoryIcon = TablerIcon;

/** Order matches marketing.categories: sanitaryware, electrical, plumbing, hvac, flooring, walls, paints, adhesives. */
export const categoryIcons: CategoryIcon[] = [IconBath, IconBulb, IconPipeline, IconAirConditioning, IconGrid4x4, IconWallpaper, IconPaint, IconTrowel];
