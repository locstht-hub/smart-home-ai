export type RoomImageKey = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'garage';

export interface RoomPresentationInput {
    id: string;
    name: string;
    type?: string;
}

export interface RoomPresentation {
    imageKey?: RoomImageKey;
    icon: string;
    accessibilityLabel: string;
}

const normalize = (value: string | undefined): string => (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const containsAny = (value: string, aliases: string[]): boolean => {
    const paddedValue = ` ${value} `;
    return aliases.some(alias => paddedValue.includes(` ${alias} `));
};

export function getRoomPresentation(room: RoomPresentationInput): RoomPresentation {
    const searchable = `${normalize(room.id)} ${normalize(room.type)} ${normalize(room.name)}`;
    let imageKey: RoomImageKey | undefined;
    let icon = 'home-outline';

    if (containsAny(searchable, ['living', 'phong khach', 'sinh hoat chung'])) {
        imageKey = 'living';
        icon = 'home-outline';
    } else if (containsAny(searchable, ['kitchen', 'nha bep', 'phong bep', 'nau an'])) {
        imageKey = 'kitchen';
        icon = 'restaurant-outline';
    } else if (containsAny(searchable, ['bedroom', 'phong ngu'])) {
        imageKey = 'bedroom';
        icon = 'bed-outline';
    } else if (containsAny(searchable, ['bathroom', 'phong tam', 'nha tam', 've sinh'])) {
        imageKey = 'bathroom';
        icon = 'water-outline';
    } else if (containsAny(searchable, ['garage', 'gara', 'nha xe', 'de xe'])) {
        imageKey = 'garage';
        icon = 'car-outline';
    } else if (containsAny(searchable, ['office', 'study', 'lam viec', 'hoc tap'])) {
        icon = 'desktop-outline';
    } else if (containsAny(searchable, ['dining', 'phong an'])) {
        icon = 'restaurant-outline';
    } else if (containsAny(searchable, ['balcony', 'garden', 'ban cong', 'san vuon'])) {
        icon = 'leaf-outline';
    } else if (containsAny(searchable, ['laundry', 'giat'])) {
        icon = 'shirt-outline';
    } else if (containsAny(searchable, ['storage', 'warehouse', 'kho'])) {
        icon = 'cube-outline';
    } else if (containsAny(searchable, ['hallway', 'corridor', 'hanh lang'])) {
        icon = 'enter-outline';
    } else if (containsAny(searchable, ['kid', 'child', 'tre em', 'em be'])) {
        icon = 'happy-outline';
    }

    return {
        imageKey,
        icon,
        accessibilityLabel: `Minh họa ${room.name}`,
    };
}
