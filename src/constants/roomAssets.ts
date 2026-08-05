import { ImageSourcePropType } from 'react-native';
import { RoomImageKey } from './roomPresentation';

export const roomIconImages: Record<RoomImageKey, ImageSourcePropType> = {
    living: require('../../assets/rooms/living.png'),
    kitchen: require('../../assets/rooms/kitchen.png'),
    bedroom: require('../../assets/rooms/bedroom.png'),
    bathroom: require('../../assets/rooms/bathroom.png'),
    garage: require('../../assets/rooms/garage.png'),
};
